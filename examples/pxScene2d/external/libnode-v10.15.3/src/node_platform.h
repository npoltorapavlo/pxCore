#ifndef SRC_NODE_PLATFORM_H_
#define SRC_NODE_PLATFORM_H_

#if defined(NODE_WANT_INTERNALS) && NODE_WANT_INTERNALS

#include <queue>
#include <unordered_map>
#include <vector>
#include <functional>

#include "libplatform/libplatform.h"
#include "node.h"
#include "node_mutex.h"
#include "tracing/agent.h"
#include "uv.h"

namespace node {

class NodePlatform;
class IsolateData;
class PerIsolatePlatformData;

template <class T>
class TaskQueue {
 public:
  TaskQueue();
  ~TaskQueue() {}

  void Push(std::unique_ptr<T> task);
  std::unique_ptr<T> Pop();
  std::unique_ptr<T> BlockingPop();
  std::queue<std::unique_ptr<T>> PopAll();
  void NotifyOfCompletion();
  void BlockingDrain();
  void Stop();

 private:
  Mutex lock_;
  ConditionVariable tasks_available_;
  ConditionVariable tasks_drained_;
  int outstanding_tasks_;
  bool stopped_;
  std::queue<std::unique_ptr<T>> task_queue_;
};

struct DelayedTask {
  std::unique_ptr<v8::Task> task;
  uv_timer_t timer;
  double timeout;
  std::shared_ptr<PerIsolatePlatformData> platform_data;
};

// This acts as the foreground task runner for a given Isolate.
class PerIsolatePlatformData :
    public v8::TaskRunner,
    public std::enable_shared_from_this<PerIsolatePlatformData> {
 public:
  PerIsolatePlatformData(v8::Isolate* isolate, uv_loop_t* loop);
  ~PerIsolatePlatformData();

  void PostTask(std::unique_ptr<v8::Task> task) override;
  void PostIdleTask(std::unique_ptr<v8::IdleTask> task) override;
  void PostDelayedTask(std::unique_ptr<v8::Task> task,
                       double delay_in_seconds) override;
  bool IdleTasksEnabled() override { return false; };

  void Shutdown();

  void ref();
  int unref();

  // Returns true if work was dispatched or executed. New tasks that are
  // posted during flushing of the queue are postponed until the next
  // flushing.
  bool FlushForegroundTasksInternal();
  void CancelPendingDelayedTasks();

  const uv_loop_t* event_loop() const { return loop_; }

 private:
  void DeleteFromScheduledTasks(DelayedTask* task);

  static void FlushTasks(uv_async_t* handle);
  static void RunForegroundTask(std::unique_ptr<v8::Task> task);
  static void RunForegroundTask(uv_timer_t* timer);

  int ref_count_ = 1;
  uv_loop_t* const loop_;
  uv_async_t* flush_tasks_ = nullptr;
  TaskQueue<v8::Task> foreground_tasks_;
  TaskQueue<DelayedTask> foreground_delayed_tasks_;

  // Use a custom deleter because libuv needs to close the handle first.
  typedef std::unique_ptr<DelayedTask, std::function<void(DelayedTask*)>>
      DelayedTaskPointer;
  std::vector<DelayedTaskPointer> scheduled_delayed_tasks_;
};

// This acts as the single background task runner for all Isolates.
class BackgroundTaskRunner : public v8::TaskRunner {
 public:
  explicit BackgroundTaskRunner(int thread_pool_size);

  void PostTask(std::unique_ptr<v8::Task> task) override;
  void PostIdleTask(std::unique_ptr<v8::IdleTask> task) override;
  void PostDelayedTask(std::unique_ptr<v8::Task> task,
                       double delay_in_seconds) override;
  bool IdleTasksEnabled() override { return false; };

  void BlockingDrain();
  void Shutdown();

  size_t NumberOfAvailableBackgroundThreads() const;

 private:
  TaskQueue<v8::Task> background_tasks_;

  class DelayedTaskScheduler;
  std::unique_ptr<DelayedTaskScheduler> delayed_task_scheduler_;

  std::vector<std::unique_ptr<uv_thread_t>> threads_;

  Mutex platform_workers_mutex_;
  ConditionVariable platform_workers_ready_;
  int pending_platform_workers_;
};

class NodePlatform : public MultiIsolatePlatform {
 public:
  NodePlatform(int thread_pool_size,
               node::tracing::TracingController* tracing_controller);
  virtual ~NodePlatform() {}

  void DrainBackgroundTasks(v8::Isolate* isolate) override;
  void CancelPendingDelayedTasks(v8::Isolate* isolate) override;
  void Shutdown();

  // v8::Platform implementation.
  size_t NumberOfAvailableBackgroundThreads() override;
  void CallOnBackgroundThread(v8::Task* task,
                              ExpectedRuntime expected_runtime) override;
  void CallOnForegroundThread(v8::Isolate* isolate, v8::Task* task) override;
  void CallDelayedOnForegroundThread(v8::Isolate* isolate, v8::Task* task,
                                     double delay_in_seconds) override;
  bool IdleTasksEnabled(v8::Isolate* isolate) override;
  double MonotonicallyIncreasingTime() override;
  double CurrentClockTimeMillis() override;
  node::tracing::TracingController* GetTracingController() override;
  bool FlushForegroundTasks(v8::Isolate* isolate) override;

  void RegisterIsolate(IsolateData* isolate_data, uv_loop_t* loop) override;
  void UnregisterIsolate(IsolateData* isolate_data) override;

  std::shared_ptr<v8::TaskRunner> GetBackgroundTaskRunner(
      v8::Isolate* isolate) override;
  std::shared_ptr<v8::TaskRunner> GetForegroundTaskRunner(
      v8::Isolate* isolate) override;

 private:
  std::shared_ptr<PerIsolatePlatformData> ForIsolate(v8::Isolate* isolate);

  Mutex per_isolate_mutex_;
  std::unordered_map<v8::Isolate*,
                     std::shared_ptr<PerIsolatePlatformData>> per_isolate_;

  node::tracing::TracingController* tracing_controller_;
  std::shared_ptr<BackgroundTaskRunner> background_task_runner_;
};

}  // namespace node

#endif  // defined(NODE_WANT_INTERNALS) && NODE_WANT_INTERNALS

#endif  // SRC_NODE_PLATFORM_H_
