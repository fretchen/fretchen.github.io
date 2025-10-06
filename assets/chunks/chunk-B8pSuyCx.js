import{_ as m,G as u,L as B,e as C,l as w,b as S,a as D,t as T,v as P,g as z,s as A,H as E,I as F,A as W}from"./chunk-BLdQmUJU.js";import{p as _}from"./chunk-D5NYfyQi.js";import{p as L}from"./chunk-CVXTvWdJ.js";import"./chunk-DBQ_J0i3.js";import"./chunk-kOh39j1J.js";/* empty css              *//* empty css              */import"./chunk-BDRzeg3d.js";import"./chunk-DmlFjuBC.js";import"./chunk-DF5K452e.js";import"./chunk-D-ZhOCA6.js";import"./chunk-B5FzeXPM.js";import"./chunk-D4mw09ce.js";/* empty css              */import"./chunk-CdcH6iod.js";import"./chunk-B_Z43jOW.js";import"./chunk-BKIMisdM.js";var N=F.packet,b,v=(b=class{constructor(){this.packet=[],this.setAccTitle=S,this.getAccTitle=D,this.setDiagramTitle=T,this.getDiagramTitle=P,this.getAccDescription=z,this.setAccDescription=A}getConfig(){const t=u({...N,...E().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){W(),this.packet=[]}},m(b,"PacketDB"),b),I=1e4,M=m((e,t)=>{_(e,t);let r=-1,o=[],n=1;const{bitsPerRow:l}=t.getConfig();for(let{start:a,end:s,bits:d,label:c}of e.blocks){if(a!==void 0&&s!==void 0&&s<a)throw new Error(`Packet block ${a} - ${s} is invalid. End must be greater than start.`);if(a??=r+1,a!==r+1)throw new Error(`Packet block ${a} - ${s??a} is not contiguous. It should start from ${r+1}.`);if(d===0)throw new Error(`Packet block ${a} is invalid. Cannot have a zero bit field.`);for(s??=a+(d??1)-1,d??=s-a+1,r=s,w.debug(`Packet block ${a} - ${r} with label ${c}`);o.length<=l+1&&t.getPacket().length<I;){const[p,i]=Y({start:a,end:s,bits:d,label:c},n,l);if(o.push(p),p.end+1===n*l&&(t.pushWord(o),o=[],n++),!i)break;({start:a,end:s,bits:d,label:c}=i)}}t.pushWord(o)},"populate"),Y=m((e,t,r)=>{if(e.start===void 0)throw new Error("start should have been set during first phase");if(e.end===void 0)throw new Error("end should have been set during first phase");if(e.start>e.end)throw new Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*r)return[e,void 0];const o=t*r-1,n=t*r;return[{start:e.start,end:o,label:e.label,bits:o-e.start},{start:n,end:e.end,label:e.label,bits:e.end-n}]},"getNextFittingBlock"),x={parser:{yy:void 0},parse:m(async e=>{const t=await L("packet",e),r=x.parser?.yy;if(!(r instanceof v))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");w.debug(t),M(t,r)},"parse")},G=m((e,t,r,o)=>{const n=o.db,l=n.getConfig(),{rowHeight:a,paddingY:s,bitWidth:d,bitsPerRow:c}=l,p=n.getPacket(),i=n.getDiagramTitle(),h=a+s,g=h*(p.length+1)-(i?0:a),k=d*c+2,f=B(t);f.attr("viewbox",`0 0 ${k} ${g}`),C(f,g,k,l.useMaxWidth);for(const[y,$]of p.entries())H(f,$,y,l);f.append("text").text(i).attr("x",k/2).attr("y",g-h/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),H=m((e,t,r,{rowHeight:o,paddingX:n,paddingY:l,bitWidth:a,bitsPerRow:s,showBits:d})=>{const c=e.append("g"),p=r*(o+l)+l;for(const i of t){const h=i.start%s*a+1,g=(i.end-i.start+1)*a-n;if(c.append("rect").attr("x",h).attr("y",p).attr("width",g).attr("height",o).attr("class","packetBlock"),c.append("text").attr("x",h+g/2).attr("y",p+o/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(i.label),!d)continue;const k=i.end===i.start,f=p-2;c.append("text").attr("x",h+(k?g/2:0)).attr("y",f).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",k?"middle":"start").text(i.start),k||c.append("text").attr("x",h+g).attr("y",f).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(i.end)}},"drawWord"),O={draw:G},j={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},K=m(({packet:e}={})=>{const t=u(j,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},"styles"),ct={parser:x,get db(){return new v},renderer:O,styles:K};export{ct as diagram};
