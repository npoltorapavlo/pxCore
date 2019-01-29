px.import({scene: 'px:scene.1.js', keys: 'px:tools.keys.js'}).then(im => {
  const scene = im.scene;
  const keys = im.keys;
  const root = im.scene.root;
  const x = 640;
  const y = 320;
  
  scene.create({t: "rect", parent: root, fillColor: 0x002200FF, w: 200, h: 300, x: x, y: y});
  scene.create({t: "rect", parent: root, fillColor: 0x007700FF, w: 100, h: 50, x: x, y: y});
  const txt1 = scene.create({t: "text", x: x, y: y, w: 100, h: 50, text: "Text", parent: root, pixelSize: 32});
  const txt2 = scene.create({t: "text", x: x, y: y, w: 100, h: 50, text: "-------", parent: root, pixelSize: 32, textColor: 0xFF0000FF});
  
  const getMatrix = pxobj => {
    const m = [];
    for (let i = 0; i < 16; ++i)
      m[i] = pxobj[`m${Math.floor(i/4)+1}${i%4+1}`];
    return m;
  };
  
  const setMatrix = (pxobj, m) => {
    for (let i = 0; i < 16; ++i)
      pxobj[`m${Math.floor(i/4)+1}${i%4+1}`] = m[i];
  };
  
  const rand = (min, max) => {
    return Math.random() * (max-min) + min;
  };
  
  const a_tween = scene.animation.EASE_OUT_ELASTIC;
  const a_type = scene.animation.OPTION_FASTFORWARD;
  
  let interval = null;
  
  scene.root.on("onKeyDown", function (e) {
    clearInterval(interval);
    
    /**
     * identity
     * 1 0 0
     0 1 0
     0 0 1
     */
    if (e.keyCode === keys.ZERO) {
      setMatrix(txt1, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1]);
      setMatrix(txt2, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, 0, 1]);
      console.log(`r=${txt1.r} x=${txt1.x} y=${txt1.y} sx=${txt1.sx} sy=${txt1.sy}`);
    }
    
    
    
    
    /**
     * rotate 60 + translate X200 Y300
     * http://angrytools.com/css-generator/transform/
     * 0.50 -0.87 200
     0.87  0.50 300
     0     0    1
     */
    else if (e.keyCode === keys.ONE) {
      const a = txt1.animate({ r: 60, x: 200+x, y: 300+y, cx:0, cy:0, sx:1, sy:1 }, 1.25, a_tween, a_type, 1);
      a.done.then(() => {
        const m = getMatrix(txt1);
        console.log(m);
        const a2 = txt1.animate({ r: 0, x: x, y: y, cx:0, cy:0, sx:1, sy:1 }, 1.25, a_tween, a_type, 1);
        a2.done.then(() => {
          // generated at http://angrytools.com/css-generator/transform/
          setMatrix(txt1, [0.50, -0.87, 0, 0, 0.87, 0.50, 0, 0, 0, 0, 1, 0, 200+x, 300+y, 0, 1]);
          console.log(`r=${txt1.r} x=${txt1.x} y=${txt1.y} sx=${txt1.sx} sy=${txt1.sy}`);
        });
      });
    }
    
    /**
     * rotate -180 around CX100 CY50
     * http://angrytools.com/css-generator/transform/
     * -1.00  0.00 200
     -0.00 -1.00 100
     0     0    1
     */
    else if (e.keyCode === keys.TWO) {
      const a = txt1.animate({ r: -180, x:x, y:y, cx:100, cy:50, sx:1, sy:1 }, 1.25, a_tween, a_type, 1);
      a.done.then(() => {
        const m = getMatrix(txt1);
        console.log(m);
        const a2 = txt1.animate({ r: 0, x:x, y:y, cx:100, cy:50, sx:1, sy:1 }, 1.25, a_tween, a_type, 1);
        a2.done.then(() => {
          setMatrix(txt1, m);
          console.log(`r=${txt1.r} x=${txt1.x} y=${txt1.y} sx=${txt1.sx} sy=${txt1.sy}`);
        });
      });
    }
    
    /**
     * rotate 45 + stretch W3.0 H0.5
     * http://angrytools.com/css-generator/transform/
     * 2.12 -0.35 0
     2.12  0.35 0
     0     0    1
     */
    else if (e.keyCode === keys.THREE) {
      const a = txt1.animate({ r: 45, x:x, y:y, cx:0, cy:0, sx: 3.0, sy: 0.5 }, 1.25, a_tween, a_type, 1);
      a.done.then(() => {
        const m = getMatrix(txt1);
        console.log(m);
        const a2 = txt1.animate({ r: 0, x:x, y:y, cx:0, cy:0, sx: 1, sy:1 }, 1.25, a_tween, a_type, 1);
        a2.done.then(() => {
          setMatrix(txt1, m);
          console.log(`r=${txt1.r} x=${txt1.x} y=${txt1.y} sx=${txt1.sx} sy=${txt1.sy}`);
        });
      });
    }
    
    
    
    
    
    
    /**
     * RANDOM
     * rotate, set matrix
     */
    else if (e.keyCode === keys.FIVE) {
      interval = setInterval(() => {
        const angle = rand(0, 180);
        // 0..180 ok
        // 180..360 incorrect +180
        // -180..0 incorrect +-
        // -360..-180 ok
        console.log(angle);
        const a = txt1.animate({ r:angle, x: x, y: y, cx:0, cy:0, sx:1, sy:1 }, 0.25, a_tween, a_type, 1);
        a.done.then(() => {
          const m = getMatrix(txt1);
          setMatrix(txt2, m);
        });
      }, 1000);
    }
    
    /**
     * RANDOM
     * rotate around CX100 CY50, set matrix
     */
    else if (e.keyCode === keys.SIX) {
      interval = setInterval(() => {
        const angle = rand(0, 180);
        // 0..180 ok
        // 180..360 incorrect +180
        // -180..0 incorrect +-
        // -360..-180 ok
        console.log(angle);
        const a = txt1.animate({ r:angle, x: x, y: y, cx:100, cy:50, sx:1, sy:1 }, 0.25, a_tween, a_type, 1);
        a.done.then(() => {
          const m = getMatrix(txt1);
          setMatrix(txt2, m);
        });
      }, 1000);
    }
    
    /**
     * RANDOM
     * rotate + stretch W3.0 H0.5, set matrix
     */
    else if (e.keyCode === keys.SEVEN) {
      interval = setInterval(() => {
        const angle = rand(0, 180);
        // 0..180 ok
        // 180..360 incorrect +180
        // -180..0 incorrect +-
        // -360..-180 ok
        console.log(angle);
        const a = txt1.animate({ r:angle, x: x, y: y, cx:0, cy:0, sx:3.0, sy:0.5 }, 0.25, a_tween, a_type, 1);
        a.done.then(() => {
          const m = getMatrix(txt1);
          setMatrix(txt2, m);
        });
      }, 1000);
    }
  });
  
}).catch(err => console.error(`Import failed: ${err}`));