const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/chunk-BWqIOTfY.js","assets/chunks/chunk-Y3izU2hr.js","assets/chunks/chunk-DHGBf05e.js","assets/chunks/chunk-CPI3dSSv.js","assets/chunks/chunk-DpGr4lqO.js","assets/static/vike-react-9c9f96f4.BcWtY8Ol.css","assets/static/layouts_style-b34a8e57.D8B4iL9t.css","assets/static/layouts_panda-c5b34b81.C4mnF8NB.css","assets/chunks/chunk-CmcPtN53.js","assets/chunks/chunk-CDRdhx_n.js","assets/chunks/chunk-eGMzeCmz.js","assets/chunks/chunk-DbKlYQqD.js","assets/chunks/chunk-DmWvr9tl.js","assets/chunks/chunk-wGSCvPlp.js","assets/chunks/chunk-DSnL6MJR.js","assets/chunks/chunk-Bpzws9BT.js","assets/chunks/chunk-CL7B-cuD.js","assets/chunks/chunk-Cp9SGBso.js","assets/chunks/chunk-CxK9mYxy.js","assets/chunks/chunk-B0dJmSn6.js","assets/chunks/chunk-DqQyVDeX.js","assets/chunks/chunk-B-hz-2f4.js","assets/chunks/chunk-Cund_RpY.js","assets/chunks/chunk-eIlXyped.js","assets/chunks/chunk-DPmmsGCU.js","assets/chunks/chunk-CvxVAI3A.js","assets/chunks/chunk-Ci5jEJrH.js","assets/chunks/chunk-Bzu4G4b4.js","assets/chunks/chunk-DHpDa0lt.js","assets/chunks/chunk-BU95YjV0.js","assets/chunks/chunk-CY7y0Agn.js","assets/chunks/chunk-Co26Shvz.js","assets/chunks/chunk-CPN5lE49.js","assets/chunks/chunk-BBoJOJno.js","assets/chunks/chunk-BcLL-Cf0.js","assets/chunks/chunk-uq1bo00P.js","assets/chunks/chunk-Bdj3MfxW.js","assets/chunks/chunk-Cu8Qh0Fv.js","assets/chunks/chunk-B2okyeIE.js","assets/chunks/chunk-BKKzjvcz.js","assets/chunks/chunk-DTQvMZs9.js","assets/chunks/chunk-COxLe05y.js","assets/chunks/chunk-BtGBvWHs.js","assets/chunks/chunk-DgTOLUQr.js","assets/chunks/chunk-_q6AVk_A.js","assets/chunks/chunk-C1HfG35y.js","assets/chunks/chunk-c2N-OiMc.js","assets/chunks/chunk-mcZ_KScU.js","assets/chunks/chunk-Cf7z4q7m.js","assets/chunks/chunk-BHyyCsmN.js","assets/chunks/chunk-BTVEXdCM.js","assets/chunks/chunk-DBiiZBsM.js","assets/chunks/chunk-DNCcAo5c.js","assets/chunks/chunk-ZCyB26_L.js","assets/chunks/chunk-DciKm2ff.js","assets/chunks/chunk-BwIasAe4.js","assets/chunks/chunk-RtZ46hmO.js","assets/chunks/chunk-C5bNw6Qu.js","assets/chunks/chunk-BGsMltrP.js","assets/chunks/chunk-BbRigLqy.js","assets/chunks/chunk-BI_ei_Va.js","assets/chunks/chunk-DwZyTuk-.js","assets/chunks/chunk-D29FmrqW.js","assets/chunks/chunk-BbZd-bnY.js","assets/chunks/chunk-CVDW0z-u.js","assets/chunks/chunk-BMp4FZnQ.js","assets/chunks/chunk-BHA4gc6t.js","assets/chunks/chunk-R1dPd_Qm.js","assets/chunks/chunk-BucVoJ8N.js","assets/chunks/chunk-p1-chzLA.js","assets/chunks/chunk-BvfkUKMR.js","assets/chunks/chunk-CheIzYSz.js","assets/chunks/chunk-CSxTTrAD.js","assets/chunks/chunk-Dn-9u9_-.js","assets/chunks/chunk-DZJYPElC.js","assets/chunks/chunk-CVZsm0xf.js","assets/chunks/chunk-BfpXESVb.js","assets/chunks/chunk-DOKhPNfE.js","assets/chunks/chunk-Cqz6VfWO.js","assets/chunks/chunk-CGjyNQjw.js","assets/chunks/chunk-CFDQoH0O.js"])))=>i.map(i=>d[i]);
import{B as N,D as q,i as S,r as b,a as E,x as f,n as Y,F as V,o as H,e as X}from"./chunk-Y3izU2hr.js";import{_ as a}from"./chunk-DHGBf05e.js";const w={getSpacingStyles(t,e){if(Array.isArray(t))return t[e]?`var(--wui-spacing-${t[e]})`:void 0;if(typeof t=="string")return`var(--wui-spacing-${t})`},getFormattedDate(t){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric"}).format(t)},getHostName(t){try{return new URL(t).hostname}catch{return""}},getTruncateString({string:t,charsStart:e,charsEnd:i,truncate:r}){return t.length<=e+i?t:r==="end"?`${t.substring(0,e)}...`:r==="start"?`...${t.substring(t.length-i)}`:`${t.substring(0,Math.floor(e))}...${t.substring(t.length-Math.floor(i))}`},generateAvatarColors(t){const i=t.toLowerCase().replace(/^0x/iu,"").replace(/[^a-f0-9]/gu,"").substring(0,6).padEnd(6,"0"),r=this.hexToRgb(i),n=getComputedStyle(document.documentElement).getPropertyValue("--w3m-border-radius-master"),s=100-3*Number(n?.replace("px","")),c=`${s}% ${s}% at 65% 40%`,u=[];for(let h=0;h<5;h+=1){const p=this.tintColor(r,.15*h);u.push(`rgb(${p[0]}, ${p[1]}, ${p[2]})`)}return`
    --local-color-1: ${u[0]};
    --local-color-2: ${u[1]};
    --local-color-3: ${u[2]};
    --local-color-4: ${u[3]};
    --local-color-5: ${u[4]};
    --local-radial-circle: ${c}
   `},hexToRgb(t){const e=parseInt(t,16),i=e>>16&255,r=e>>8&255,n=e&255;return[i,r,n]},tintColor(t,e){const[i,r,n]=t,o=Math.round(i+(255-i)*e),s=Math.round(r+(255-r)*e),c=Math.round(n+(255-n)*e);return[o,s,c]},isNumber(t){return{number:/^[0-9]+$/u}.number.test(t)},getColorTheme(t){return t||(typeof window<"u"&&window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)")?.matches?"dark":"light":"dark")},splitBalance(t){const e=t.split(".");return e.length===2?[e[0],e[1]]:["0","00"]},roundNumber(t,e,i){return t.toString().length>=e?Number(t).toFixed(i):t},formatNumberToLocalString(t,e=2){return t===void 0?"0.00":typeof t=="number"?t.toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e}):parseFloat(t).toLocaleString("en-US",{maximumFractionDigits:e,minimumFractionDigits:e})}};function K(t,e){const{kind:i,elements:r}=e;return{kind:i,elements:r,finisher(n){customElements.get(t)||customElements.define(t,n)}}}function Z(t,e){return customElements.get(t)||customElements.define(t,e),e}function $(t){return function(i){return typeof i=="function"?Z(t,i):K(t,i)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Q={attribute:!0,type:String,converter:q,reflect:!1,hasChanged:N},J=(t=Q,e,i)=>{const{kind:r,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(o===void 0&&globalThis.litPropertyMetadata.set(n,o=new Map),r==="setter"&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),r==="accessor"){const{name:s}=i;return{set(c){const u=e.get.call(this);e.set.call(this,c),this.requestUpdate(s,u,t)},init(c){return c!==void 0&&this.C(s,void 0,t,c),c}}}if(r==="setter"){const{name:s}=i;return function(c){const u=this[s];e.call(this,c),this.requestUpdate(s,u,t)}}throw Error("Unsupported decorator location: "+r)};function l(t){return(e,i)=>typeof i=="object"?J(t,e,i):((r,n,o)=>{const s=n.hasOwnProperty(o);return n.constructor.createProperty(o,r),s?Object.getOwnPropertyDescriptor(n,o):void 0})(t,e,i)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function bt(t){return l({...t,state:!0,attribute:!1})}const tt=S`
  :host {
    display: flex;
    width: inherit;
    height: inherit;
  }
`;var _=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let d=class extends E{render(){return this.style.cssText=`
      flex-direction: ${this.flexDirection};
      flex-wrap: ${this.flexWrap};
      flex-basis: ${this.flexBasis};
      flex-grow: ${this.flexGrow};
      flex-shrink: ${this.flexShrink};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      column-gap: ${this.columnGap&&`var(--wui-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--wui-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--wui-spacing-${this.gap})`};
      padding-top: ${this.padding&&w.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&w.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&w.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&w.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&w.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&w.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&w.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&w.getSpacingStyles(this.margin,3)};
    `,f`<slot></slot>`}};d.styles=[b,tt];_([l()],d.prototype,"flexDirection",void 0);_([l()],d.prototype,"flexWrap",void 0);_([l()],d.prototype,"flexBasis",void 0);_([l()],d.prototype,"flexGrow",void 0);_([l()],d.prototype,"flexShrink",void 0);_([l()],d.prototype,"alignItems",void 0);_([l()],d.prototype,"justifyContent",void 0);_([l()],d.prototype,"columnGap",void 0);_([l()],d.prototype,"rowGap",void 0);_([l()],d.prototype,"gap",void 0);_([l()],d.prototype,"padding",void 0);_([l()],d.prototype,"margin",void 0);d=_([$("wui-flex")],d);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const $t=t=>t??Y;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const et=t=>t===null||typeof t!="object"&&typeof t!="function",it=t=>t.strings===void 0;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const W={ATTRIBUTE:1,CHILD:2},U=t=>(...e)=>({_$litDirective$:t,values:e});let F=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,i,r){this._$Ct=e,this._$AM=i,this._$Ci=r}_$AS(e,i){return this.update(e,i)}update(e,i){return this.render(...i)}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const R=(t,e)=>{const i=t._$AN;if(i===void 0)return!1;for(const r of i)r._$AO?.(e,!1),R(r,e);return!0},I=t=>{let e,i;do{if((e=t._$AM)===void 0)break;i=e._$AN,i.delete(t),t=e}while(i?.size===0)},G=t=>{for(let e;e=t._$AM;t=e){let i=e._$AN;if(i===void 0)e._$AN=i=new Set;else if(i.has(t))break;i.add(t),at(e)}};function rt(t){this._$AN!==void 0?(I(this),this._$AM=t,G(this)):this._$AM=t}function ot(t,e=!1,i=0){const r=this._$AH,n=this._$AN;if(n!==void 0&&n.size!==0)if(e)if(Array.isArray(r))for(let o=i;o<r.length;o++)R(r[o],!1),I(r[o]);else r!=null&&(R(r,!1),I(r));else R(this,t)}const at=t=>{t.type==W.CHILD&&(t._$AP??=ot,t._$AQ??=rt)};class nt extends F{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,i,r){super._$AT(e,i,r),G(this),this.isConnected=e._$AU}_$AO(e,i=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),i&&(R(this,e),I(this))}setValue(e){if(it(this._$Ct))this._$Ct._$AI(e,this);else{const i=[...this._$Ct._$AH];i[this._$Ci]=e,this._$Ct._$AI(i,this,0)}}disconnected(){}reconnected(){}}/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class st{constructor(e){this.G=e}disconnect(){this.G=void 0}reconnect(e){this.G=e}deref(){return this.G}}class ct{constructor(){this.Y=void 0,this.Z=void 0}get(){return this.Y}pause(){this.Y??=new Promise(e=>this.Z=e)}resume(){this.Z?.(),this.Y=this.Z=void 0}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const j=t=>!et(t)&&typeof t.then=="function",B=1073741823;class lt extends nt{constructor(){super(...arguments),this._$Cwt=B,this._$Cbt=[],this._$CK=new st(this),this._$CX=new ct}render(...e){return e.find(i=>!j(i))??V}update(e,i){const r=this._$Cbt;let n=r.length;this._$Cbt=i;const o=this._$CK,s=this._$CX;this.isConnected||this.disconnected();for(let c=0;c<i.length&&!(c>this._$Cwt);c++){const u=i[c];if(!j(u))return this._$Cwt=c,u;c<n&&u===r[c]||(this._$Cwt=B,n=0,Promise.resolve(u).then(async h=>{for(;s.get();)await s.get();const p=o.deref();if(p!==void 0){const D=p._$Cbt.indexOf(u);D>-1&&D<p._$Cwt&&(p._$Cwt=D,p.setValue(h))}}))}return V}disconnected(){this._$CK.disconnect(),this._$CX.pause()}reconnected(){this._$CK.reconnect(this),this._$CX.resume()}}const ut=U(lt);class dt{constructor(){this.cache=new Map}set(e,i){this.cache.set(e,i)}get(e){return this.cache.get(e)}has(e){return this.cache.has(e)}delete(e){this.cache.delete(e)}clear(){this.cache.clear()}}const C=new dt,_t=S`
  :host {
    display: flex;
    aspect-ratio: var(--local-aspect-ratio);
    color: var(--local-color);
    width: var(--local-width);
  }

  svg {
    width: inherit;
    height: inherit;
    object-fit: contain;
    object-position: center;
  }

  .fallback {
    width: var(--local-width);
    height: var(--local-height);
  }
`;var A=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};const M={add:async()=>(await a(async()=>{const{addSvg:t}=await import("./chunk-BWqIOTfY.js");return{addSvg:t}},__vite__mapDeps([0,1,2,3,4,5,6,7]))).addSvg,allWallets:async()=>(await a(async()=>{const{allWalletsSvg:t}=await import("./chunk-CmcPtN53.js");return{allWalletsSvg:t}},__vite__mapDeps([8,1,2,3,4,5,6,7]))).allWalletsSvg,arrowBottomCircle:async()=>(await a(async()=>{const{arrowBottomCircleSvg:t}=await import("./chunk-CDRdhx_n.js");return{arrowBottomCircleSvg:t}},__vite__mapDeps([9,1,2,3,4,5,6,7]))).arrowBottomCircleSvg,appStore:async()=>(await a(async()=>{const{appStoreSvg:t}=await import("./chunk-eGMzeCmz.js");return{appStoreSvg:t}},__vite__mapDeps([10,1,2,3,4,5,6,7]))).appStoreSvg,apple:async()=>(await a(async()=>{const{appleSvg:t}=await import("./chunk-DbKlYQqD.js");return{appleSvg:t}},__vite__mapDeps([11,1,2,3,4,5,6,7]))).appleSvg,arrowBottom:async()=>(await a(async()=>{const{arrowBottomSvg:t}=await import("./chunk-DmWvr9tl.js");return{arrowBottomSvg:t}},__vite__mapDeps([12,1,2,3,4,5,6,7]))).arrowBottomSvg,arrowLeft:async()=>(await a(async()=>{const{arrowLeftSvg:t}=await import("./chunk-wGSCvPlp.js");return{arrowLeftSvg:t}},__vite__mapDeps([13,1,2,3,4,5,6,7]))).arrowLeftSvg,arrowRight:async()=>(await a(async()=>{const{arrowRightSvg:t}=await import("./chunk-DSnL6MJR.js");return{arrowRightSvg:t}},__vite__mapDeps([14,1,2,3,4,5,6,7]))).arrowRightSvg,arrowTop:async()=>(await a(async()=>{const{arrowTopSvg:t}=await import("./chunk-Bpzws9BT.js");return{arrowTopSvg:t}},__vite__mapDeps([15,1,2,3,4,5,6,7]))).arrowTopSvg,bank:async()=>(await a(async()=>{const{bankSvg:t}=await import("./chunk-CL7B-cuD.js");return{bankSvg:t}},__vite__mapDeps([16,1,2,3,4,5,6,7]))).bankSvg,browser:async()=>(await a(async()=>{const{browserSvg:t}=await import("./chunk-Cp9SGBso.js");return{browserSvg:t}},__vite__mapDeps([17,1,2,3,4,5,6,7]))).browserSvg,card:async()=>(await a(async()=>{const{cardSvg:t}=await import("./chunk-CxK9mYxy.js");return{cardSvg:t}},__vite__mapDeps([18,1,2,3,4,5,6,7]))).cardSvg,checkmark:async()=>(await a(async()=>{const{checkmarkSvg:t}=await import("./chunk-B0dJmSn6.js");return{checkmarkSvg:t}},__vite__mapDeps([19,1,2,3,4,5,6,7]))).checkmarkSvg,checkmarkBold:async()=>(await a(async()=>{const{checkmarkBoldSvg:t}=await import("./chunk-DqQyVDeX.js");return{checkmarkBoldSvg:t}},__vite__mapDeps([20,1,2,3,4,5,6,7]))).checkmarkBoldSvg,chevronBottom:async()=>(await a(async()=>{const{chevronBottomSvg:t}=await import("./chunk-B-hz-2f4.js");return{chevronBottomSvg:t}},__vite__mapDeps([21,1,2,3,4,5,6,7]))).chevronBottomSvg,chevronLeft:async()=>(await a(async()=>{const{chevronLeftSvg:t}=await import("./chunk-Cund_RpY.js");return{chevronLeftSvg:t}},__vite__mapDeps([22,1,2,3,4,5,6,7]))).chevronLeftSvg,chevronRight:async()=>(await a(async()=>{const{chevronRightSvg:t}=await import("./chunk-eIlXyped.js");return{chevronRightSvg:t}},__vite__mapDeps([23,1,2,3,4,5,6,7]))).chevronRightSvg,chevronTop:async()=>(await a(async()=>{const{chevronTopSvg:t}=await import("./chunk-DPmmsGCU.js");return{chevronTopSvg:t}},__vite__mapDeps([24,1,2,3,4,5,6,7]))).chevronTopSvg,chromeStore:async()=>(await a(async()=>{const{chromeStoreSvg:t}=await import("./chunk-CvxVAI3A.js");return{chromeStoreSvg:t}},__vite__mapDeps([25,1,2,3,4,5,6,7]))).chromeStoreSvg,clock:async()=>(await a(async()=>{const{clockSvg:t}=await import("./chunk-Ci5jEJrH.js");return{clockSvg:t}},__vite__mapDeps([26,1,2,3,4,5,6,7]))).clockSvg,close:async()=>(await a(async()=>{const{closeSvg:t}=await import("./chunk-Bzu4G4b4.js");return{closeSvg:t}},__vite__mapDeps([27,1,2,3,4,5,6,7]))).closeSvg,compass:async()=>(await a(async()=>{const{compassSvg:t}=await import("./chunk-DHpDa0lt.js");return{compassSvg:t}},__vite__mapDeps([28,1,2,3,4,5,6,7]))).compassSvg,coinPlaceholder:async()=>(await a(async()=>{const{coinPlaceholderSvg:t}=await import("./chunk-BU95YjV0.js");return{coinPlaceholderSvg:t}},__vite__mapDeps([29,1,2,3,4,5,6,7]))).coinPlaceholderSvg,copy:async()=>(await a(async()=>{const{copySvg:t}=await import("./chunk-CY7y0Agn.js");return{copySvg:t}},__vite__mapDeps([30,1,2,3,4,5,6,7]))).copySvg,cursor:async()=>(await a(async()=>{const{cursorSvg:t}=await import("./chunk-Co26Shvz.js");return{cursorSvg:t}},__vite__mapDeps([31,1,2,3,4,5,6,7]))).cursorSvg,cursorTransparent:async()=>(await a(async()=>{const{cursorTransparentSvg:t}=await import("./chunk-CPN5lE49.js");return{cursorTransparentSvg:t}},__vite__mapDeps([32,1,2,3,4,5,6,7]))).cursorTransparentSvg,desktop:async()=>(await a(async()=>{const{desktopSvg:t}=await import("./chunk-BBoJOJno.js");return{desktopSvg:t}},__vite__mapDeps([33,1,2,3,4,5,6,7]))).desktopSvg,disconnect:async()=>(await a(async()=>{const{disconnectSvg:t}=await import("./chunk-BcLL-Cf0.js");return{disconnectSvg:t}},__vite__mapDeps([34,1,2,3,4,5,6,7]))).disconnectSvg,discord:async()=>(await a(async()=>{const{discordSvg:t}=await import("./chunk-uq1bo00P.js");return{discordSvg:t}},__vite__mapDeps([35,1,2,3,4,5,6,7]))).discordSvg,etherscan:async()=>(await a(async()=>{const{etherscanSvg:t}=await import("./chunk-Bdj3MfxW.js");return{etherscanSvg:t}},__vite__mapDeps([36,1,2,3,4,5,6,7]))).etherscanSvg,extension:async()=>(await a(async()=>{const{extensionSvg:t}=await import("./chunk-Cu8Qh0Fv.js");return{extensionSvg:t}},__vite__mapDeps([37,1,2,3,4,5,6,7]))).extensionSvg,externalLink:async()=>(await a(async()=>{const{externalLinkSvg:t}=await import("./chunk-B2okyeIE.js");return{externalLinkSvg:t}},__vite__mapDeps([38,1,2,3,4,5,6,7]))).externalLinkSvg,facebook:async()=>(await a(async()=>{const{facebookSvg:t}=await import("./chunk-BKKzjvcz.js");return{facebookSvg:t}},__vite__mapDeps([39,1,2,3,4,5,6,7]))).facebookSvg,farcaster:async()=>(await a(async()=>{const{farcasterSvg:t}=await import("./chunk-DTQvMZs9.js");return{farcasterSvg:t}},__vite__mapDeps([40,1,2,3,4,5,6,7]))).farcasterSvg,filters:async()=>(await a(async()=>{const{filtersSvg:t}=await import("./chunk-COxLe05y.js");return{filtersSvg:t}},__vite__mapDeps([41,1,2,3,4,5,6,7]))).filtersSvg,github:async()=>(await a(async()=>{const{githubSvg:t}=await import("./chunk-BtGBvWHs.js");return{githubSvg:t}},__vite__mapDeps([42,1,2,3,4,5,6,7]))).githubSvg,google:async()=>(await a(async()=>{const{googleSvg:t}=await import("./chunk-DgTOLUQr.js");return{googleSvg:t}},__vite__mapDeps([43,1,2,3,4,5,6,7]))).googleSvg,helpCircle:async()=>(await a(async()=>{const{helpCircleSvg:t}=await import("./chunk-_q6AVk_A.js");return{helpCircleSvg:t}},__vite__mapDeps([44,1,2,3,4,5,6,7]))).helpCircleSvg,image:async()=>(await a(async()=>{const{imageSvg:t}=await import("./chunk-C1HfG35y.js");return{imageSvg:t}},__vite__mapDeps([45,1,2,3,4,5,6,7]))).imageSvg,id:async()=>(await a(async()=>{const{idSvg:t}=await import("./chunk-c2N-OiMc.js");return{idSvg:t}},__vite__mapDeps([46,1,2,3,4,5,6,7]))).idSvg,infoCircle:async()=>(await a(async()=>{const{infoCircleSvg:t}=await import("./chunk-mcZ_KScU.js");return{infoCircleSvg:t}},__vite__mapDeps([47,1,2,3,4,5,6,7]))).infoCircleSvg,lightbulb:async()=>(await a(async()=>{const{lightbulbSvg:t}=await import("./chunk-Cf7z4q7m.js");return{lightbulbSvg:t}},__vite__mapDeps([48,1,2,3,4,5,6,7]))).lightbulbSvg,mail:async()=>(await a(async()=>{const{mailSvg:t}=await import("./chunk-BHyyCsmN.js");return{mailSvg:t}},__vite__mapDeps([49,1,2,3,4,5,6,7]))).mailSvg,mobile:async()=>(await a(async()=>{const{mobileSvg:t}=await import("./chunk-BTVEXdCM.js");return{mobileSvg:t}},__vite__mapDeps([50,1,2,3,4,5,6,7]))).mobileSvg,more:async()=>(await a(async()=>{const{moreSvg:t}=await import("./chunk-DBiiZBsM.js");return{moreSvg:t}},__vite__mapDeps([51,1,2,3,4,5,6,7]))).moreSvg,networkPlaceholder:async()=>(await a(async()=>{const{networkPlaceholderSvg:t}=await import("./chunk-DNCcAo5c.js");return{networkPlaceholderSvg:t}},__vite__mapDeps([52,1,2,3,4,5,6,7]))).networkPlaceholderSvg,nftPlaceholder:async()=>(await a(async()=>{const{nftPlaceholderSvg:t}=await import("./chunk-ZCyB26_L.js");return{nftPlaceholderSvg:t}},__vite__mapDeps([53,1,2,3,4,5,6,7]))).nftPlaceholderSvg,off:async()=>(await a(async()=>{const{offSvg:t}=await import("./chunk-DciKm2ff.js");return{offSvg:t}},__vite__mapDeps([54,1,2,3,4,5,6,7]))).offSvg,playStore:async()=>(await a(async()=>{const{playStoreSvg:t}=await import("./chunk-BwIasAe4.js");return{playStoreSvg:t}},__vite__mapDeps([55,1,2,3,4,5,6,7]))).playStoreSvg,plus:async()=>(await a(async()=>{const{plusSvg:t}=await import("./chunk-RtZ46hmO.js");return{plusSvg:t}},__vite__mapDeps([56,1,2,3,4,5,6,7]))).plusSvg,qrCode:async()=>(await a(async()=>{const{qrCodeIcon:t}=await import("./chunk-C5bNw6Qu.js");return{qrCodeIcon:t}},__vite__mapDeps([57,1,2,3,4,5,6,7]))).qrCodeIcon,recycleHorizontal:async()=>(await a(async()=>{const{recycleHorizontalSvg:t}=await import("./chunk-BGsMltrP.js");return{recycleHorizontalSvg:t}},__vite__mapDeps([58,1,2,3,4,5,6,7]))).recycleHorizontalSvg,refresh:async()=>(await a(async()=>{const{refreshSvg:t}=await import("./chunk-BbRigLqy.js");return{refreshSvg:t}},__vite__mapDeps([59,1,2,3,4,5,6,7]))).refreshSvg,search:async()=>(await a(async()=>{const{searchSvg:t}=await import("./chunk-BI_ei_Va.js");return{searchSvg:t}},__vite__mapDeps([60,1,2,3,4,5,6,7]))).searchSvg,send:async()=>(await a(async()=>{const{sendSvg:t}=await import("./chunk-DwZyTuk-.js");return{sendSvg:t}},__vite__mapDeps([61,1,2,3,4,5,6,7]))).sendSvg,swapHorizontal:async()=>(await a(async()=>{const{swapHorizontalSvg:t}=await import("./chunk-D29FmrqW.js");return{swapHorizontalSvg:t}},__vite__mapDeps([62,1,2,3,4,5,6,7]))).swapHorizontalSvg,swapHorizontalMedium:async()=>(await a(async()=>{const{swapHorizontalMediumSvg:t}=await import("./chunk-BbZd-bnY.js");return{swapHorizontalMediumSvg:t}},__vite__mapDeps([63,1,2,3,4,5,6,7]))).swapHorizontalMediumSvg,swapHorizontalBold:async()=>(await a(async()=>{const{swapHorizontalBoldSvg:t}=await import("./chunk-CVDW0z-u.js");return{swapHorizontalBoldSvg:t}},__vite__mapDeps([64,1,2,3,4,5,6,7]))).swapHorizontalBoldSvg,swapHorizontalRoundedBold:async()=>(await a(async()=>{const{swapHorizontalRoundedBoldSvg:t}=await import("./chunk-BMp4FZnQ.js");return{swapHorizontalRoundedBoldSvg:t}},__vite__mapDeps([65,1,2,3,4,5,6,7]))).swapHorizontalRoundedBoldSvg,swapVertical:async()=>(await a(async()=>{const{swapVerticalSvg:t}=await import("./chunk-BHA4gc6t.js");return{swapVerticalSvg:t}},__vite__mapDeps([66,1,2,3,4,5,6,7]))).swapVerticalSvg,telegram:async()=>(await a(async()=>{const{telegramSvg:t}=await import("./chunk-R1dPd_Qm.js");return{telegramSvg:t}},__vite__mapDeps([67,1,2,3,4,5,6,7]))).telegramSvg,threeDots:async()=>(await a(async()=>{const{threeDotsSvg:t}=await import("./chunk-BucVoJ8N.js");return{threeDotsSvg:t}},__vite__mapDeps([68,1,2,3,4,5,6,7]))).threeDotsSvg,twitch:async()=>(await a(async()=>{const{twitchSvg:t}=await import("./chunk-p1-chzLA.js");return{twitchSvg:t}},__vite__mapDeps([69,1,2,3,4,5,6,7]))).twitchSvg,twitter:async()=>(await a(async()=>{const{xSvg:t}=await import("./chunk-BvfkUKMR.js");return{xSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6,7]))).xSvg,twitterIcon:async()=>(await a(async()=>{const{twitterIconSvg:t}=await import("./chunk-CheIzYSz.js");return{twitterIconSvg:t}},__vite__mapDeps([71,1,2,3,4,5,6,7]))).twitterIconSvg,verify:async()=>(await a(async()=>{const{verifySvg:t}=await import("./chunk-CSxTTrAD.js");return{verifySvg:t}},__vite__mapDeps([72,1,2,3,4,5,6,7]))).verifySvg,verifyFilled:async()=>(await a(async()=>{const{verifyFilledSvg:t}=await import("./chunk-Dn-9u9_-.js");return{verifyFilledSvg:t}},__vite__mapDeps([73,1,2,3,4,5,6,7]))).verifyFilledSvg,wallet:async()=>(await a(async()=>{const{walletSvg:t}=await import("./chunk-DZJYPElC.js");return{walletSvg:t}},__vite__mapDeps([74,1,2,3,4,5,6,7]))).walletSvg,walletConnect:async()=>(await a(async()=>{const{walletConnectSvg:t}=await import("./chunk-CVZsm0xf.js");return{walletConnectSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6,7]))).walletConnectSvg,walletConnectLightBrown:async()=>(await a(async()=>{const{walletConnectLightBrownSvg:t}=await import("./chunk-CVZsm0xf.js");return{walletConnectLightBrownSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6,7]))).walletConnectLightBrownSvg,walletConnectBrown:async()=>(await a(async()=>{const{walletConnectBrownSvg:t}=await import("./chunk-CVZsm0xf.js");return{walletConnectBrownSvg:t}},__vite__mapDeps([75,1,2,3,4,5,6,7]))).walletConnectBrownSvg,walletPlaceholder:async()=>(await a(async()=>{const{walletPlaceholderSvg:t}=await import("./chunk-BfpXESVb.js");return{walletPlaceholderSvg:t}},__vite__mapDeps([76,1,2,3,4,5,6,7]))).walletPlaceholderSvg,warningCircle:async()=>(await a(async()=>{const{warningCircleSvg:t}=await import("./chunk-DOKhPNfE.js");return{warningCircleSvg:t}},__vite__mapDeps([77,1,2,3,4,5,6,7]))).warningCircleSvg,x:async()=>(await a(async()=>{const{xSvg:t}=await import("./chunk-BvfkUKMR.js");return{xSvg:t}},__vite__mapDeps([70,1,2,3,4,5,6,7]))).xSvg,info:async()=>(await a(async()=>{const{infoSvg:t}=await import("./chunk-Cqz6VfWO.js");return{infoSvg:t}},__vite__mapDeps([78,1,2,3,4,5,6,7]))).infoSvg,exclamationTriangle:async()=>(await a(async()=>{const{exclamationTriangleSvg:t}=await import("./chunk-CGjyNQjw.js");return{exclamationTriangleSvg:t}},__vite__mapDeps([79,1,2,3,4,5,6,7]))).exclamationTriangleSvg,reown:async()=>(await a(async()=>{const{reownSvg:t}=await import("./chunk-CFDQoH0O.js");return{reownSvg:t}},__vite__mapDeps([80,1,2,3,4,5,6,7]))).reownSvg};async function gt(t){if(C.has(t))return C.get(t);const i=(M[t]??M.copy)();return C.set(t,i),i}let m=class extends E{constructor(){super(...arguments),this.size="md",this.name="copy",this.color="fg-300",this.aspectRatio="1 / 1"}render(){return this.style.cssText=`
      --local-color: ${`var(--wui-color-${this.color});`}
      --local-width: ${`var(--wui-icon-size-${this.size});`}
      --local-aspect-ratio: ${this.aspectRatio}
    `,f`${ut(gt(this.name),f`<div class="fallback"></div>`)}`}};m.styles=[b,H,_t];A([l()],m.prototype,"size",void 0);A([l()],m.prototype,"name",void 0);A([l()],m.prototype,"color",void 0);A([l()],m.prototype,"aspectRatio",void 0);m=A([$("wui-icon")],m);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ht=U(class extends F{constructor(t){if(super(t),t.type!==W.ATTRIBUTE||t.name!=="class"||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){if(this.st===void 0){this.st=new Set,t.strings!==void 0&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(r=>r!=="")));for(const r in e)e[r]&&!this.nt?.has(r)&&this.st.add(r);return this.render(e)}const i=t.element.classList;for(const r of this.st)r in e||(i.remove(r),this.st.delete(r));for(const r in e){const n=!!e[r];n===this.st.has(r)||this.nt?.has(r)||(n?(i.add(r),this.st.add(r)):(i.remove(r),this.st.delete(r)))}return V}}),pt=S`
  :host {
    display: inline-flex !important;
  }

  slot {
    width: 100%;
    display: inline-block;
    font-style: normal;
    font-family: var(--wui-font-family);
    font-feature-settings:
      'tnum' on,
      'lnum' on,
      'case' on;
    line-height: 130%;
    font-weight: var(--wui-font-weight-regular);
    overflow: inherit;
    text-overflow: inherit;
    text-align: var(--local-align);
    color: var(--local-color);
  }

  .wui-line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }

  .wui-line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .wui-font-medium-400 {
    font-size: var(--wui-font-size-medium);
    font-weight: var(--wui-font-weight-light);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-medium-600 {
    font-size: var(--wui-font-size-medium);
    letter-spacing: var(--wui-letter-spacing-medium);
  }

  .wui-font-title-600 {
    font-size: var(--wui-font-size-title);
    letter-spacing: var(--wui-letter-spacing-title);
  }

  .wui-font-title-6-600 {
    font-size: var(--wui-font-size-title-6);
    letter-spacing: var(--wui-letter-spacing-title-6);
  }

  .wui-font-mini-700 {
    font-size: var(--wui-font-size-mini);
    letter-spacing: var(--wui-letter-spacing-mini);
    text-transform: uppercase;
  }

  .wui-font-large-500,
  .wui-font-large-600,
  .wui-font-large-700 {
    font-size: var(--wui-font-size-large);
    letter-spacing: var(--wui-letter-spacing-large);
  }

  .wui-font-2xl-500,
  .wui-font-2xl-600,
  .wui-font-2xl-700 {
    font-size: var(--wui-font-size-2xl);
    letter-spacing: var(--wui-letter-spacing-2xl);
  }

  .wui-font-paragraph-400,
  .wui-font-paragraph-500,
  .wui-font-paragraph-600,
  .wui-font-paragraph-700 {
    font-size: var(--wui-font-size-paragraph);
    letter-spacing: var(--wui-letter-spacing-paragraph);
  }

  .wui-font-small-400,
  .wui-font-small-500,
  .wui-font-small-600 {
    font-size: var(--wui-font-size-small);
    letter-spacing: var(--wui-letter-spacing-small);
  }

  .wui-font-tiny-400,
  .wui-font-tiny-500,
  .wui-font-tiny-600 {
    font-size: var(--wui-font-size-tiny);
    letter-spacing: var(--wui-letter-spacing-tiny);
  }

  .wui-font-micro-700,
  .wui-font-micro-600 {
    font-size: var(--wui-font-size-micro);
    letter-spacing: var(--wui-letter-spacing-micro);
    text-transform: uppercase;
  }

  .wui-font-tiny-400,
  .wui-font-small-400,
  .wui-font-medium-400,
  .wui-font-paragraph-400 {
    font-weight: var(--wui-font-weight-light);
  }

  .wui-font-large-700,
  .wui-font-paragraph-700,
  .wui-font-micro-700,
  .wui-font-mini-700 {
    font-weight: var(--wui-font-weight-bold);
  }

  .wui-font-medium-600,
  .wui-font-medium-title-600,
  .wui-font-title-6-600,
  .wui-font-large-600,
  .wui-font-paragraph-600,
  .wui-font-small-600,
  .wui-font-tiny-600,
  .wui-font-micro-600 {
    font-weight: var(--wui-font-weight-medium);
  }

  :host([disabled]) {
    opacity: 0.4;
  }
`;var O=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let y=class extends E{constructor(){super(...arguments),this.variant="paragraph-500",this.color="fg-300",this.align="left",this.lineClamp=void 0}render(){const e={[`wui-font-${this.variant}`]:!0,[`wui-color-${this.color}`]:!0,[`wui-line-clamp-${this.lineClamp}`]:!!this.lineClamp};return this.style.cssText=`
      --local-align: ${this.align};
      --local-color: var(--wui-color-${this.color});
    `,f`<slot class=${ht(e)}></slot>`}};y.styles=[b,pt];O([l()],y.prototype,"variant",void 0);O([l()],y.prototype,"color",void 0);O([l()],y.prototype,"align",void 0);O([l()],y.prototype,"lineClamp",void 0);y=O([$("wui-text")],y);const vt=S`
  :host {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    background-color: var(--wui-color-gray-glass-020);
    border-radius: var(--local-border-radius);
    border: var(--local-border);
    box-sizing: content-box;
    width: var(--local-size);
    height: var(--local-size);
    min-height: var(--local-size);
    min-width: var(--local-size);
  }

  @supports (background: color-mix(in srgb, white 50%, black)) {
    :host {
      background-color: color-mix(in srgb, var(--local-bg-value) var(--local-bg-mix), transparent);
    }
  }
`;var v=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let g=class extends E{constructor(){super(...arguments),this.size="md",this.backgroundColor="accent-100",this.iconColor="accent-100",this.background="transparent",this.border=!1,this.borderColor="wui-color-bg-125",this.icon="copy"}render(){const e=this.iconSize||this.size,i=this.size==="lg",r=this.size==="xl",n=i?"12%":"16%",o=i?"xxs":r?"s":"3xl",s=this.background==="gray",c=this.background==="opaque",u=this.backgroundColor==="accent-100"&&c||this.backgroundColor==="success-100"&&c||this.backgroundColor==="error-100"&&c||this.backgroundColor==="inverse-100"&&c;let h=`var(--wui-color-${this.backgroundColor})`;return u?h=`var(--wui-icon-box-bg-${this.backgroundColor})`:s&&(h=`var(--wui-color-gray-${this.backgroundColor})`),this.style.cssText=`
       --local-bg-value: ${h};
       --local-bg-mix: ${u||s?"100%":n};
       --local-border-radius: var(--wui-border-radius-${o});
       --local-size: var(--wui-icon-box-size-${this.size});
       --local-border: ${this.borderColor==="wui-color-bg-125"?"2px":"1px"} solid ${this.border?`var(--${this.borderColor})`:"transparent"}
   `,f` <wui-icon color=${this.iconColor} size=${e} name=${this.icon}></wui-icon> `}};g.styles=[b,X,vt];v([l()],g.prototype,"size",void 0);v([l()],g.prototype,"backgroundColor",void 0);v([l()],g.prototype,"iconColor",void 0);v([l()],g.prototype,"iconSize",void 0);v([l()],g.prototype,"background",void 0);v([l({type:Boolean})],g.prototype,"border",void 0);v([l()],g.prototype,"borderColor",void 0);v([l()],g.prototype,"icon",void 0);g=v([$("wui-icon-box")],g);const wt=S`
  :host {
    display: block;
    width: var(--local-width);
    height: var(--local-height);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    border-radius: inherit;
  }
`;var L=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let x=class extends E{constructor(){super(...arguments),this.src="./path/to/image.jpg",this.alt="Image",this.size=void 0}render(){return this.style.cssText=`
      --local-width: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      --local-height: ${this.size?`var(--wui-icon-size-${this.size});`:"100%"};
      `,f`<img src=${this.src} alt=${this.alt} @error=${this.handleImageError} />`}handleImageError(){this.dispatchEvent(new CustomEvent("onLoadError",{bubbles:!0,composed:!0}))}};x.styles=[b,H,wt];L([l()],x.prototype,"src",void 0);L([l()],x.prototype,"alt",void 0);L([l()],x.prototype,"size",void 0);x=L([$("wui-image")],x);const ft=S`
  :host {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--wui-spacing-m);
    padding: 0 var(--wui-spacing-3xs) !important;
    border-radius: var(--wui-border-radius-5xs);
    transition:
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius, background-color;
  }

  :host > wui-text {
    transform: translateY(5%);
  }

  :host([data-variant='main']) {
    background-color: var(--wui-color-accent-glass-015);
    color: var(--wui-color-accent-100);
  }

  :host([data-variant='shade']) {
    background-color: var(--wui-color-gray-glass-010);
    color: var(--wui-color-fg-200);
  }

  :host([data-variant='success']) {
    background-color: var(--wui-icon-box-bg-success-100);
    color: var(--wui-color-success-100);
  }

  :host([data-variant='error']) {
    background-color: var(--wui-icon-box-bg-error-100);
    color: var(--wui-color-error-100);
  }

  :host([data-size='lg']) {
    padding: 11px 5px !important;
  }

  :host([data-size='lg']) > wui-text {
    transform: translateY(2%);
  }
`;var z=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let T=class extends E{constructor(){super(...arguments),this.variant="main",this.size="lg"}render(){this.dataset.variant=this.variant,this.dataset.size=this.size;const e=this.size==="md"?"mini-700":"micro-700";return f`
      <wui-text data-variant=${this.variant} variant=${e} color="inherit">
        <slot></slot>
      </wui-text>
    `}};T.styles=[b,ft];z([l()],T.prototype,"variant",void 0);z([l()],T.prototype,"size",void 0);T=z([$("wui-tag")],T);const mt=S`
  :host {
    display: flex;
  }

  :host([data-size='sm']) > svg {
    width: 12px;
    height: 12px;
  }

  :host([data-size='md']) > svg {
    width: 16px;
    height: 16px;
  }

  :host([data-size='lg']) > svg {
    width: 24px;
    height: 24px;
  }

  :host([data-size='xl']) > svg {
    width: 32px;
    height: 32px;
  }

  svg {
    animation: rotate 2s linear infinite;
  }

  circle {
    fill: none;
    stroke: var(--local-color);
    stroke-width: 4px;
    stroke-dasharray: 1, 124;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  :host([data-size='md']) > svg > circle {
    stroke-width: 6px;
  }

  :host([data-size='sm']) > svg > circle {
    stroke-width: 8px;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 124;
      stroke-dashoffset: 0;
    }

    50% {
      stroke-dasharray: 90, 124;
      stroke-dashoffset: -35;
    }

    100% {
      stroke-dashoffset: -125;
    }
  }
`;var k=function(t,e,i,r){var n=arguments.length,o=n<3?e:r===null?r=Object.getOwnPropertyDescriptor(e,i):r,s;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")o=Reflect.decorate(t,e,i,r);else for(var c=t.length-1;c>=0;c--)(s=t[c])&&(o=(n<3?s(o):n>3?s(e,i,o):s(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o};let P=class extends E{constructor(){super(...arguments),this.color="accent-100",this.size="lg"}render(){return this.style.cssText=`--local-color: ${this.color==="inherit"?"inherit":`var(--wui-color-${this.color})`}`,this.dataset.size=this.size,f`<svg viewBox="25 25 50 50">
      <circle r="20" cy="50" cx="50"></circle>
    </svg>`}};P.styles=[b,mt];k([l()],P.prototype,"color",void 0);k([l()],P.prototype,"size",void 0);P=k([$("wui-loading-spinner")],P);export{w as U,ht as a,$ as c,U as e,nt as f,l as n,$t as o,bt as r};
