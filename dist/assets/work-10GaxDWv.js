import{g as l,S,a as x,b as y,s as T}from"./menu-Di8WIL2Q.js";import{S as C,O as z,W as R,a as D,V as f,M as L,P as b,T as q,L as E}from"./three.module-DKfRSda2.js";import"./hover-DQ49xIUQ.js";import"https://cdn.jsdelivr.net/npm/lenis@1.3.17/+esm";const d=[{title:"Gilded Noise",description:"Heat, gold, and the sharp glint of teeth caught in a half-lit confession.",type:"Still",field:"Cinematic",date:"2025",image:"/work/work-1.jpg",route:"/film"},{title:"White Rush",description:"Motion buried in snow. A body pressed against speed, swallowed by cold silence.",type:"Sequence",field:"Documentary",date:"2023",image:"/work/work-2.jpg",route:"/film"},{title:"Copper Skin",description:"Sweat, shadow, and the texture of closeness sculpted by unrelenting light.",type:"Portrait",field:"Experimental",date:"2024",image:"/work/work-3.jpg",route:"/film"},{title:"Static Youth",description:"Black and white glare. Two figures in defiance, gazes sharpened through the lens.",type:"Editorial",field:"Brutalist",date:"2022",image:"/work/work-4.jpg",route:"/film"}],F=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,U=`
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTexture1Size;
  uniform vec2 uTexture2Size;
  varying vec2 vUv;
  
  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }
  
  vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
    vec2 scaledDirection = direction;
    scaledDirection.y *= 2.0;
    return uv - scaledDirection * factor;
  }
  
  struct LensDistortion {
    vec2 distortedUV;
    float inside;
  };
  
  LensDistortion getLensDistortion(
    vec2 p,
    vec2 uv,
    vec2 sphereCenter,
    float sphereRadius,
    float focusFactor
  ) {
    vec2 distortionDirection = normalize(p - sphereCenter);
    float focusRadius = sphereRadius * focusFactor;
    float focusStrength = sphereRadius / 3000.0;
    float focusSdf = length(sphereCenter - p) - focusRadius;
    float sphereSdf = length(sphereCenter - p) - sphereRadius;
    float inside = smoothstep(0.0, 1.0, -sphereSdf / (sphereRadius * 0.001));
    
    float magnifierFactor = focusSdf / (sphereRadius - focusRadius);
    float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
    mFactor = pow(mFactor, 5.0);
    
    float distortionFactor = mFactor * focusStrength;
    
    vec2 distortedUV = getDistortedUv(uv, distortionDirection, distortionFactor);
    
    return LensDistortion(distortedUV, inside);
  }
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 p = vUv * uResolution;
    
    vec2 uv1 = getCoverUV(vUv, uTexture1Size);
    vec2 uv2 = getCoverUV(vUv, uTexture2Size);
    
    float maxRadius = length(uResolution) * 1.5;
    float bubbleRadius = uProgress * maxRadius;
    vec2 sphereCenter = center * uResolution;
    float focusFactor = 0.25;
    
    float dist = length(sphereCenter - p);
    float mask = step(bubbleRadius, dist);
    
    vec4 currentImg = texture2D(uTexture1, uv1);
    
    LensDistortion distortion = getLensDistortion(
      p, uv2, sphereCenter, bubbleRadius, focusFactor
    );
    
    vec4 newImg = texture2D(uTexture2, distortion.distortedUV);
    
    float finalMask = max(mask, 1.0 - distortion.inside);
    vec4 color = mix(newImg, currentImg, finalMask);
    
    gl_FragColor = color;
  }
`;l.registerPlugin(S);l.config({nullTargetWarn:!1});let c=0,v=!1,o=[],i,m;function k(e){if(e.querySelectorAll(".char").length>0)return;const t=e.textContent.split(" ");e.innerHTML="",t.forEach((n,s)=>{const a=document.createElement("div");if(a.className="word",[...n].forEach(r=>{const u=document.createElement("div");u.className="char",u.innerHTML=`<span>${r}</span>`,a.appendChild(u)}),e.appendChild(a),s<t.length-1){const r=document.createElement("div");r.className="char space-char",r.innerHTML="<span> </span>",e.appendChild(r)}})}function g(e){new S(e,{type:"lines",linesClass:"line"}),e.querySelectorAll(".line").forEach(t=>{t.innerHTML=`<span>${t.textContent}</span>`})}function M(e){let t=!1,n=null;e.dataset.originalColor||(e.dataset.originalColor=getComputedStyle(e).color),e.addEventListener("mouseenter",()=>{t||(t=!0,n&&n.wordSplit?.revert(),n=T(e,0,{duration:.1,charDelay:25,stagger:10,maxIterations:5}),setTimeout(()=>{t=!1},250))}),e.addEventListener("mouseleave",()=>{e.style.color=e.dataset.originalColor||""})}function p(e){const t=e.querySelector(".slide-title h1");t&&k(t),e.querySelectorAll(".slide-description p").forEach(g);const n=e.querySelector(".slide-link a");n&&(g(n),M(n))}const w=e=>{const t=document.createElement("div");return t.className="slider-content",t.style.opacity="0",t.innerHTML=`
    <div class="slide-title"><h1>${e.title}</h1></div>
    <div class="slide-description">
      <p>${e.description}</p>
      <div class="slide-info">
        <p>Type. ${e.type}</p>
        <p>Field. ${e.field}</p>
        <p>Date. ${e.date}</p>
      </div>
      <div class="slide-link">
        <a href="${e.route}">[ View Full Project ]</a>
      </div>
    </div>
  `,t},P=e=>{const t=document.querySelector(".slider-content"),n=document.querySelector(".slider"),s=l.timeline(),a=t.querySelector(".slide-title h1");a&&x(a,0),s.to([...t.querySelectorAll(".line span")],{y:"-100%",duration:.6,stagger:.025,ease:"power2.inOut"},.1).call(()=>{const r=w(d[e]);s.kill(),n.appendChild(r),l.set(r.querySelectorAll("span"),{y:"100%"}),setTimeout(()=>{p(r);const u=r.querySelector(".slide-title h1"),h=r.querySelectorAll(".line span");l.set(h,{y:"100%"}),l.set(r,{opacity:1}),l.timeline({onComplete:()=>{v=!1,c=e,t.remove()}}).call(()=>{u&&y(u,0)}).to(h,{y:"0%",duration:.5,stagger:.1,ease:"power2.inOut"},.3)},100)},null,.8)},V=()=>{const e=document.querySelector(".slider-content");p(e);const t=e.querySelectorAll(".line span");l.set(t,{y:"0%"})},A=async()=>{const e=new C,t=new z(-1,1,1,-1,0,1);m=new R({canvas:document.querySelector("canvas"),antialias:!0}),m.setSize(window.innerWidth,window.innerHeight),i=new D({uniforms:{uTexture1:{value:null},uTexture2:{value:null},uProgress:{value:0},uResolution:{value:new f(window.innerWidth,window.innerHeight)},uTexture1Size:{value:new f(1,1)},uTexture2Size:{value:new f(1,1)}},vertexShader:F,fragmentShader:U}),e.add(new L(new b(2,2),i));const n=new q;for(const a of d){const r=await new Promise(u=>n.load(a.image,u));r.minFilter=r.magFilter=E,r.userData={size:new f(r.image.width,r.image.height)},o.push(r)}i.uniforms.uTexture1.value=o[0],i.uniforms.uTexture2.value=o[1],i.uniforms.uTexture1Size.value=o[0].userData.size,i.uniforms.uTexture2Size.value=o[1].userData.size;const s=()=>{requestAnimationFrame(s),m.render(e,t)};s()},H=()=>{if(v)return;v=!0;const e=(c+1)%d.length;i.uniforms.uTexture1.value=o[c],i.uniforms.uTexture2.value=o[e],i.uniforms.uTexture1Size.value=o[c].userData.size,i.uniforms.uTexture2Size.value=o[e].userData.size,P(e),l.fromTo(i.uniforms.uProgress,{value:0},{value:1,duration:2.5,ease:"power2.inOut",onComplete:()=>{i.uniforms.uProgress.value=0,i.uniforms.uTexture1.value=o[e],i.uniforms.uTexture1Size.value=o[e].userData.size}})},I=()=>{m.setSize(window.innerWidth,window.innerHeight),i.uniforms.uResolution.value.set(window.innerWidth,window.innerHeight);const e=document.querySelector(".slider-content");if(!e)return;const t=d[c],n=document.querySelector(".slider");e.remove();const s=w(t);n.appendChild(s),document.fonts.ready.then(()=>{p(s);const a=(c+1)%d.length;i.uniforms.uTexture1.value=o[c],i.uniforms.uTexture2.value=o[a],i.uniforms.uTexture1Size.value=o[c].userData.size,i.uniforms.uTexture2Size.value=o[a].userData.size,i.uniforms.uProgress.value=0;const r=s.querySelectorAll(".line span");l.set(r,{y:"0%"}),l.set(s,{opacity:"1"})})};window.addEventListener("load",()=>{document.fonts.ready.then(()=>{V(),A()})});document.addEventListener("click",e=>{e.target.closest(".slide-link a")||e.target.closest("nav")||e.target.closest(".nav-overlay")||e.target.closest(".menu-toggle-btn")||H()});window.addEventListener("resize",I);
