/* "Rarity is the standard": one antique cushion-cut red diamond, lit like a museum piece.
   Deep oxblood ground, a single low key light, very slow rotation, no sparkle effects.
   The stone sits to the right on wide screens (text on the left) and behind the text on phones.
   Without WebGL the section keeps its CSS oxblood ground. */
(function(){
  'use strict';
  var secs=[].slice.call(document.querySelectorAll('.statement'));if(!secs.length||!window.VD3)return;
  VD3.load().then(function(K){secs.forEach(function(s){build(K,s);});}).catch(function(e){console.warn('3D stone unavailable:',e&&e.message);});

  function build(K,sec){
    var cv=sec.querySelector('canvas.rubies');if(!cv)return;
    var T=K.THREE,PI=Math.PI,still=VD3.still;
    var S=VD3.setup(K,cv,{fov:26,bloom:.18,bloomRadius:.4,threshold:.96,exposure:.95,clear:0x0a0103,factors:[1,.6,.3,.1,.04]});
    var scene=S.scene,camera=S.camera;

    // a dark gallery: black, with a few long soft lights for the facet edges to catch
    var gallery=(function(){
      var c=document.createElement('canvas');c.width=2048;c.height=1024;var x=c.getContext('2d');
      var base=x.createLinearGradient(0,0,0,1024);base.addColorStop(0,'#5a524c');base.addColorStop(.45,'#3a3431');base.addColorStop(.6,'#1c1817');base.addColorStop(1,'#2e2926');
      x.fillStyle=base;x.fillRect(0,0,2048,1024);
      for(var j=0;j<9;j++){x.fillStyle='rgba(0,0,0,.55)';x.fillRect((j*.113+.04)*2048,.08*1024,(.018+(j%3)*.01)*2048,.6*1024);}
      function soft(u,v,w,h,a,col){var g=x.createLinearGradient(0,v*1024,0,(v+h)*1024);g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(.5,'rgba('+col+','+a+')');g.addColorStop(1,'rgba('+col+',0)');x.fillStyle=g;x.fillRect(u*2048,v*1024,w*2048,h*1024);}
      soft(.32,.02,.36,.16,.5,'255,246,230');          // the key light, above
      soft(0,.0,1,.05,.3,'255,240,220');
      soft(.05,.3,.07,.34,.75,'255,236,214');soft(.78,.26,.05,.4,.6,'230,232,240');
      soft(.47,.34,.02,.26,.9,'255,250,240');soft(.6,.36,.012,.22,.8,'255,250,240');soft(.2,.4,.012,.2,.7,'255,250,240');
      for(var i=0;i<12;i++){var u=(i*.083+.02)%1;soft(u,.12,.006,.3,.6,'255,248,236');}
      var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=T.LinearFilter;t.wrapS=T.RepeatWrapping;return t;
    })();
    var mat=VD3.crystal(T,gallery,{ior:2.42,disp:.012,f0:.025,boost:2.6,scatter:.9,tint:0xffffff});
    mat.transparent=false;mat.side=T.DoubleSide;
    mat.uniforms.uTint.value.setRGB(1,.035,.07);                     // deep, slightly purplish red
    var stone=new T.Mesh(VD3.cutGeometry(T,'cushion',16),mat);
    var holder=new T.Group();holder.add(stone);scene.add(holder);
    stone.rotation.x=.95;                                            // table turned toward the viewer, at an angle

    var wide=true;
    function frame(){
      var a=camera.aspect,k=2*Math.tan(camera.fov*PI/360),d=6;
      wide=a>1.15;camera.position.set(0,0,d);camera.lookAt(0,0,0);
      var vh=k*d,vw=vh*a;
      if(wide){var s=vh*.29;holder.scale.setScalar(s);holder.position.set(vw*.23,-vh*.03,0);}
      else{var s2=Math.min(vw*.31,vh*.19);holder.scale.setScalar(s2);holder.position.set(0,-vh*.18,0);}
    }
    var lastA=0,spin=.6,last=0;
    VD3.loop(cv,function(t){
      if(camera.aspect!==lastA){lastA=camera.aspect;frame();}
      var dt=last?Math.min(.05,t-last):0;last=t;if(!still)spin+=dt*.07;      // about one turn every 90 seconds
      stone.rotation.y=spin;
      holder.rotation.y=still?0:Math.sin(t*.12)*.06;
      mat.uniforms.uRot.value=still?.4:.4+Math.sin(t*.05)*.35;
      S.composer.render();
    },S);
    sec.classList.add('gl');
  }
})();
