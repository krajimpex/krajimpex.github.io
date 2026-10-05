/* Kraj Impex Diamonds — shared behaviour. No dependencies. */
(function(){
  'use strict';
  var doc=document.documentElement;
  doc.classList.add('js');
  // scrollbar width, so full-bleed sections line up exactly with the viewport
  var setSb=function(){doc.style.setProperty('--sb',(window.innerWidth-doc.clientWidth)+'px');};setSb();window.addEventListener('resize',setSb);
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia&&window.matchMedia('(pointer: fine)').matches;
  var DPR=function(){return Math.min(2,window.devicePixelRatio||1);};
  function rng(seed){return function(){seed=(seed*16807)%2147483647;return seed/2147483647;};}
  function debounce(fn,ms){var t;return function(){clearTimeout(t);t=setTimeout(fn,ms);};}
  function fit(cv){var d=DPR(),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return null;cv.width=Math.round(w*d);cv.height=Math.round(h*d);var c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);return {c:c,w:w,h:h};}
  // run a frame loop only while the element is on screen
  function whileVisible(el,frame){
    if(still){frame(1.4);return;}
    frame(1.4); // paint once straight away so nothing is ever blank while waiting to be seen
    var on=false,raf=0;
    function loop(ms){frame(ms/1000);raf=requestAnimationFrame(loop);}
    if(!('IntersectionObserver' in window)){raf=requestAnimationFrame(loop);return;}
    new IntersectionObserver(function(es){
      var v=es[0].isIntersecting;
      if(v&&!on){on=true;raf=requestAnimationFrame(loop);}
      else if(!v&&on){on=false;cancelAnimationFrame(raf);}
    },{rootMargin:'80px'}).observe(el);
  }
  window.VD={still:still,finePointer:finePointer,rng:rng,fit:fit,DPR:DPR,whileVisible:whileVisible,debounce:debounce};

  /* ---------- header + menu ---------- */
  var head=document.querySelector('.site-head');
  if(head){
    var onScroll=function(){head.classList.toggle('scrolled',window.scrollY>8);};
    onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  }
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('site-nav');
  if(btn&&nav){
    var setMenu=function(open){
      btn.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);doc.classList.toggle('menu-open',open);
      btn.setAttribute('aria-label',open?'Close menu':'Open menu');
    };
    btn.addEventListener('click',function(){setMenu(btn.getAttribute('aria-expanded')!=='true');});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);btn.focus();}});
    nav.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
  }

  /* ---------- scroll reveal ---------- */
  var reveals=document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window&&!still){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    reveals.forEach(function(el){io.observe(el);});
  }else reveals.forEach(function(el){el.classList.add('in');});

  // light up a shape's glint once as it scrolls in (touch screens have no hover)
  var shapes=document.querySelectorAll('.shape');
  if(shapes.length&&'IntersectionObserver' in window&&!still){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var s=e.target;setTimeout(function(){s.classList.add('lit');},(+s.style.getPropertyValue('--i')||0)*120+400);so.unobserve(s);}});},{threshold:.6});
    shapes.forEach(function(s){so.observe(s);});
  }


  /* ---------- hero ground: caustics ----------
     The woven light a cut diamond throws onto silk: crossing wave fields whose meeting lines brighten,
     in champagne, gathered under an unseen stone above and drifting very slowly. One small fragment
     shader per hero; if WebGL is unavailable the CSS wine ground shows on its own. */
  var CAUSTIC_VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var CAUSTIC_FS=[
    'precision highp float;uniform vec2 uR;uniform float uT;uniform vec2 uL;',
    'float field(vec2 p,float t){float c=0.;vec2 q=p;',
    ' for(int i=0;i<3;i++){float f=float(i);q+=vec2(sin(q.y*1.6+t*.19+f*1.3),cos(q.x*1.4-t*.15+f*2.1))*.42;',
    '  float v=sin(q.x)+sin(q.y);c+=exp(-abs(v)*7.);}',
    ' return c/3.;}',
    'void main(){vec2 uv=gl_FragCoord.xy/uR;float asp=uR.x/uR.y;vec2 p=(uv-.5)*vec2(asp,1.)*6.5;',
    ' float a=field(p,uT),b=field(p*1.85+vec2(3.1,1.7),uT*1.25);',
    ' float lines=pow(a,1.7)*.95+pow(b,2.2)*.4;',
    ' float pool=smoothstep(1.05,.05,length((uv-uL)*vec2(asp*.8,1.)));',
    ' float k=clamp(lines*pool*.5,0.,1.);',
    ' gl_FragColor=vec4(vec3(1.,.87,.66)*k,k);}'
  ].join('\n');
  document.querySelectorAll('canvas.sparkle').forEach(function(cv){
    var gl=null;try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'});}catch(e){}
    if(!gl)return;
    function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
    var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,CAUSTIC_VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,CAUSTIC_FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
    gl.useProgram(pr);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var uR=gl.getUniformLocation(pr,'uR'),uT=gl.getUniformLocation(pr,'uT'),uL=gl.getUniformLocation(pr,'uL');
    var seed=(+cv.dataset.seed||0)*1.7;
    // the caustics are soft light, so they are drawn at reduced resolution and scaled up by the browser
    function size(){var d=.75,w=Math.round(cv.clientWidth*d),h=Math.round(cv.clientHeight*d);if(w&&h&&(cv.width!==w||cv.height!==h)){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}}
    function paint(t){size();if(!cv.width)return;gl.uniform2f(uR,cv.width,cv.height);gl.uniform1f(uT,t+seed);
      gl.uniform2f(uL,.5+.08*Math.sin(t*.05+seed),.62+.05*Math.sin(t*.07));gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);}
    var last=-1;whileVisible(cv,function(t){if(still||t-last>.033){last=t;paint(still?12:t);}});
    window.addEventListener('resize',debounce(function(){paint(still?12:performance.now()/1000);},150));
  });
  /* ---------- crystal tiles: light passing through a ring of cut crystal ---------- */
  var LT=[{fx:.42,fy:.62,rx:.40,ry:.13,h:.62,a0:3.6,a1:5.9},{fx:.68,fy:.52,rx:.13,ry:.07,h:.2,a0:1.6,a1:4.6},{fx:.5,fy:.42,rx:.24,ry:.1,h:.3,a0:.3,a1:2.9}];
  function crystalTile(cv){
    var o=LT[+cv.dataset.k],T={};
    function build(){
      var d=DPR(),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
      cv.width=Math.round(w*d);cv.height=Math.round(h*d);T.c=cv.getContext('2d');T.w=w;T.h=h;T.d=d;
      var rnd=rng(3+(+cv.dataset.k)*17),i,r,a;
      var fx=o.fx*w,fy=o.fy*h,rx=o.rx*w,ry=o.ry*w,ch=o.h*h;T.fx=fx;T.fy=fy;T.rx=rx;T.ry=ry;T.ch=ch;
      // layer 1: ground + crystal
      var base=document.createElement('canvas');base.width=cv.width;base.height=cv.height;var c=base.getContext('2d');c.setTransform(d,0,0,d,0,0);
      var bg=c.createRadialGradient(fx,fy,0,fx,fy,w*.9);bg.addColorStop(0,'#a9cacd');bg.addColorStop(.35,'#3d5f66');bg.addColorStop(1,'#0b1a1f');
      c.fillStyle=bg;c.fillRect(0,0,w,h);
      c.globalCompositeOperation='lighter';
      var n=Math.round(rx/7)+20,rows=Math.max(3,Math.round(ch/26)),lh=ch/rows,j;
      for(j=0;j<rows;j++)for(i=0;i<n*2;i++){a=(i+(j%2)*.5)/(n*2)*6.283;var front=Math.sin(a)>0;
        var x=fx+rx*Math.cos(a),y=fy+ry*Math.sin(a)-ch+j*lh,lw=Math.abs(Math.sin(a))*rx*3.2/n+.6,al=(front?.5:.16)*(.4+rnd()*.6);
        c.beginPath();c.moveTo(x,y);c.lineTo(x+lw/2,y+lh/2);c.lineTo(x,y+lh);c.lineTo(x-lw/2,y+lh/2);c.closePath();
        c.fillStyle='rgba(235,250,252,'+al+')';c.fill();}
      c.globalCompositeOperation='source-over';
      c.strokeStyle='rgba(240,252,255,0.7)';c.lineWidth=1.2;c.beginPath();c.ellipse(fx,fy-ch,rx,ry,0,0,6.283);c.stroke();
      var core=c.createRadialGradient(fx,fy,0,fx,fy,rx);core.addColorStop(0,'rgba(245,255,255,0.8)');core.addColorStop(1,'rgba(245,255,255,0)');
      c.fillStyle=core;c.beginPath();c.ellipse(fx,fy,rx*.9,ry*.9,0,0,6.283);c.fill();
      T.base=base;
      // layer 2: scattered rays, drawn once, turned slowly at paint time
      var rays=document.createElement('canvas');rays.width=cv.width;rays.height=cv.height;c=rays.getContext('2d');c.setTransform(d,0,0,d,0,0);
      for(i=0;i<460;i++){a=o.a0+(o.a1-o.a0)*rnd()+(rnd()-.5)*.5;r=w*(.25+rnd()*.85);
        var sx=fx+rx*Math.cos(a),sy=fy+ry*Math.sin(a),g=c.createLinearGradient(sx,sy,sx+r*Math.cos(a),sy+r*.6*Math.sin(a));
        g.addColorStop(0,'rgba(225,246,250,'+(.05+rnd()*.3)+')');g.addColorStop(1,'rgba(225,246,250,0)');
        c.strokeStyle=g;c.lineWidth=.5+rnd()*2.2;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+r*Math.cos(a),sy+r*.6*Math.sin(a));c.stroke();}
      T.rays=rays;
    }
    function paint(t){
      if(!T.base)return;var c=T.c,w=T.w,h=T.h;
      c.setTransform(1,0,0,1,0,0);c.drawImage(T.base,0,0);
      c.setTransform(T.d,0,0,T.d,0,0);
      c.globalCompositeOperation='lighter';
      // rays breathe and drift around the light source
      c.save();c.translate(T.fx,T.fy);c.rotate(Math.sin(t*.25)*.035);c.scale(1+Math.sin(t*.4)*.02,1);c.translate(-T.fx,-T.fy);
      c.globalAlpha=.75+Math.sin(t*.7)*.25;c.drawImage(T.rays,0,0,w,h);c.restore();
      // a specular band travels round the cut ring
      var sa=t*.5%6.283,bx=T.fx+T.rx*Math.cos(sa),by=T.fy+T.ry*Math.sin(sa)-T.ch/2,front=Math.sin(sa)>0;
      if(front){c.save();c.translate(bx,by);c.scale(1,T.ch/(T.rx*.5));var g=c.createRadialGradient(0,0,0,0,0,T.rx*.25);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,T.rx*.25,0,6.283);c.fill();c.restore();}
      c.globalAlpha=1;
      c.globalCompositeOperation='source-over';
    }
    build();whileVisible(cv,paint);
    window.addEventListener('resize',debounce(function(){build();if(still)paint(1.4);},150));
  }
  document.querySelectorAll('canvas.lt').forEach(crystalTile);

  /* ---------- forms ----------
     FORM_ENDPOINT: the address of a form service (for example Formspree: https://formspree.io/f/xxxxxxxx).
     Enquiries are posted there and arrive by email. Until one is set, sending an enquiry opens WhatsApp
     with the message already written, addressed to the house, for the visitor to send. */
  var FORM_ENDPOINT='';
  var WHATSAPP='919820124336';

  var code=document.getElementById('codeForm');
  if(code)code.addEventListener('submit',function(e){e.preventDefault();document.getElementById('codeMsg').textContent='This code is not recognised. Codes are issued personally by the house; please request an introduction.';});
  function compose(form){
    var lines=[form.dataset.subject||'Enquiry'];
    form.querySelectorAll('input,select,textarea').forEach(function(f){
      if(!f.name||f.type==='hidden'||f.name==='_gotcha'||!f.value.trim())return;
      var l=form.querySelector('label[for="'+f.id+'"] .label'),name=l?l.firstChild.textContent.trim():f.name;
      lines.push(name+': '+f.value.trim());
    });
    return lines.join('\n');
  }
  // enquiry forms (private and trade): check required fields on blur and on submit
  document.querySelectorAll('form.enquiry').forEach(function(form){
    var fields=form.querySelectorAll('[required]'),msg=form.querySelector('.msg'),b=form.querySelector('button[type=submit]'),label=b?b.textContent:'';
    var check=function(f){
      var v=f.value.trim(),ok=v.length>1;
      if(ok&&f.type==='email')ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      var er=document.getElementById(f.id+'Err');f.setAttribute('aria-invalid',ok?'false':'true');
      if(er)er.textContent=ok?'':(f.dataset.err||'Please fill this in.');return ok;};
    fields.forEach(function(f){f.addEventListener('blur',function(){if(f.value)check(f);});});
    form.addEventListener('submit',function(e){
      e.preventDefault();var bad=null;
      fields.forEach(function(f){if(!check(f)&&!bad)bad=f;});
      if(bad){bad.focus();msg.textContent='Please complete the marked fields.';return;}
      var trap=form.querySelector('[name="_gotcha"]');
      if(trap&&trap.value){form.reset();msg.textContent='Thank you. Your request has reached the house.';return;}   // a bot: discard quietly
      if(!FORM_ENDPOINT){
        var url='https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(compose(form));
        var w=window.open(url,'_blank','noopener');if(!w)window.location.href=url;
        msg.textContent='Your message is ready in WhatsApp, addressed to the house. Please press send there.';return;
      }
      b.disabled=true;b.textContent='Sending…';msg.textContent='';
      var fd=new FormData(form);fd.append('_subject',form.dataset.subject||'Enquiry');
      var ctl=window.AbortController?new AbortController():null,timer=setTimeout(function(){if(ctl)ctl.abort();},15000);
      fetch(FORM_ENDPOINT,{method:'POST',headers:{Accept:'application/json'},body:fd,signal:ctl?ctl.signal:undefined})
        .then(function(r){if(!r.ok)throw new Error(r.status);form.reset();msg.textContent='Thank you. Your request has reached the house, and we will reply personally.';})
        .catch(function(){msg.textContent='We could not send this just now. Please try again, or call the house on +91 98201 24336.';})
        .then(function(){clearTimeout(timer);b.disabled=false;b.textContent=label;});
    });
  });
  // arriving from a stone in the collections: name it in the private enquiry
  var askStone=new URLSearchParams(location.search).get('stone'),note=document.getElementById('fNote');
  if(askStone&&note&&!note.value)note.value='I would like to know more about stone '+askStone.slice(0,120)+'.';
  // private / trade tabs on the introduction page (#trade opens the trade form)
  var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));
  if(tabs.length){
    var show=function(t,focus){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!on;});if(focus)t.focus();};
    var fromHash=function(){var h=location.hash.slice(1);var t=tabs.filter(function(x){return x.dataset.hash===h;})[0];if(t)show(t);};
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){show(t);history.replaceState(null,'','#'+t.dataset.hash);});
      t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(d){e.preventDefault();var n=tabs[(i+d+tabs.length)%tabs.length];show(n,true);history.replaceState(null,'','#'+n.dataset.hash);}});
    });
    fromHash();window.addEventListener('hashchange',fromHash);
  }
})();
