import{$t as eI,An as rP,Ct as Ny,En as pp,Gt as ap,H as wi,Hn as vp,I as ke,Kn as yI,Ln as ti,Lt as Wl,N as f,Nt as Qy,P as ie,Pt as Th,Q as Co,Rn as uI,St as Np,Un as wp,Ut as _e,Vn as vc,X as BI,Xt as dp,Y as A,Yt as dI,Z as C,Zt as dr,_n as kp,at as G,b as Dt$1,c as U,d as ci,dt as Jh,f as ee,fn as ip,ft as K,h as oe,jn as re,kn as rI,l as Z,m as mt,nn as fr,o as Q,ot as Gl,pn as ir,pt as Kn,st as JE,tn as fp,vn as mI,wn as pc,wt as OE,x as Ei,xn as oI,yt as NE,z as se}from"./main-D7TGI362.js";import{n as gn,r as hn,t as Rt}from"./chunk-Bs0vX-M2.js";var St=Math.pow(2,31)-1;var y=class{_overlayRef;instance;containerInstance;_afterDismissed=new K;_afterOpened=new K;_onAction=new K;_durationTimeoutId;_dismissedByAction=!1;constructor(o,t){this._overlayRef=t,this.containerInstance=o,o._onExit.subscribe(()=>this._finishDismiss())}dismiss(){this._afterDismissed.closed||this.containerInstance.exit(),clearTimeout(this._durationTimeoutId)}dismissWithAction(){this._onAction.closed||(this._dismissedByAction=!0,this._onAction.next(),this._onAction.complete(),this.dismiss()),clearTimeout(this._durationTimeoutId)}closeWithAction(){this.dismissWithAction()}_dismissAfter(o){this._durationTimeoutId=setTimeout(()=>this.dismiss(),Math.min(o,St))}_open(){this._afterOpened.closed||(this._afterOpened.next(),this._afterOpened.complete())}_finishDismiss(){this._overlayRef.dispose(),this._onAction.closed||this._onAction.complete(),this._afterDismissed.next({dismissedByAction:this._dismissedByAction}),this._afterDismissed.complete(),this._dismissedByAction=!1}afterDismissed(){return this._afterDismissed}afterOpened(){return this.containerInstance._onEnter}onAction(){return this._onAction}};var _t=new A(`MatSnackBarData`);var k=class{politeness=`polite`;announcementMessage=``;viewContainerRef;duration=0;panelClass;direction;data=null;horizontalPosition=`center`;verticalPosition=`bottom`};var Mt=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵdir=OE({type:i,selectors:[[``,`matSnackBarLabel`,``]],hostAttrs:[1,`mat-mdc-snack-bar-label`,`mdc-snackbar__label`]})}return i})();var At=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵdir=OE({type:i,selectors:[[``,`matSnackBarActions`,``]],hostAttrs:[1,`mat-mdc-snack-bar-actions`,`mdc-snackbar__actions`]})}return i})();var Ct=(()=>{class i{static ɵfac=function(e){return new(e||i)};static ɵdir=OE({type:i,selectors:[[``,`matSnackBarAction`,``]],hostAttrs:[1,`mat-mdc-snack-bar-action`,`mdc-snackbar__action`]})}return i})();var wt=(()=>{class i{snackBarRef=C(y);data=C(_t);action(){this.snackBarRef.dismissWithAction()}get hasAction(){return!!this.data.action}static ɵfac=function(e){return new(e||i)};static ɵcmp=(function(){function t(e,n){if(e&1){let a=uI();ti(0,`div`,1)(1,`button`,2),vp(`click`,function(){Wl(a);let s=dI();return Gl(s.action())}),BI(2),pc()()}if(e&2){let a=dI();Qy(2),vc(` `,a.data.action,` `)}}return NE({type:i,selectors:[[`simple-snack-bar`]],hostAttrs:[1,`mat-mdc-simple-snack-bar`],exportAs:[`matSnackBar`],decls:3,vars:2,consts:[[`matSnackBarLabel`,``],[`matSnackBarActions`,``],[`matButton`,``,`matSnackBarAction`,``,3,`click`]],template:function(n,a){n&1&&(ti(0,`div`,0),BI(1),pc(),JE(2,t,3,1,`div`,1)),n&2&&(Qy(),vc(` `,a.data.message,`
`),Qy(),eI(a.hasAction?2:-1))},dependencies:[hn,Mt,At,Ct],styles:[`.mat-mdc-simple-snack-bar {
  display: flex;
}
.mat-mdc-simple-snack-bar .mat-mdc-snack-bar-label {
  max-height: 50vh;
  overflow: auto;
}
`],encapsulation:2})})()}return i})();var V=`_mat-snack-bar-enter`;var q=`_mat-snack-bar-exit`;var Bt=(()=>{class i extends Z{_ngZone=C(_e);_elementRef=C(fr);_changeDetectorRef=C(rP);_platform=C(f);_animationsDisabled=wi();snackBarConfig=C(k);_document=C(Kn);_trackedModals=/* @__PURE__ */ new Set;_enterFallback;_exitFallback;_injector=C(re);_announceDelay=150;_announceTimeoutId;_destroyed=!1;_portalOutlet;_onAnnounce=new K;_onExit=new K;_onEnter=new K;_animationState=`void`;_live;_label;_role;_liveElementId=C(se).getId(`mat-snack-bar-container-live-`);constructor(){super();let t=this.snackBarConfig;t.politeness===`assertive`&&!t.announcementMessage?this._live=`assertive`:t.politeness===`off`?this._live=`off`:this._live=`polite`,this._platform.FIREFOX&&(this._live===`polite`&&(this._role=`status`),this._live===`assertive`&&(this._role=`alert`))}attachComponentPortal(t){this._assertNotAttached();let e=this._portalOutlet.attachComponentPortal(t);return this._afterPortalAttached(),e}attachTemplatePortal(t){this._assertNotAttached();let e=this._portalOutlet.attachTemplatePortal(t);return this._afterPortalAttached(),e}attachDomPortal=t=>{this._assertNotAttached();let e=this._portalOutlet.attachDomPortal(t);return this._afterPortalAttached(),e};onAnimationEnd(t){t===q?this._completeExit():t===V&&(clearTimeout(this._enterFallback),this._ngZone.run(()=>{this._onEnter.next(),this._onEnter.complete()}))}enter(){this._destroyed||(this._animationState=`visible`,this._changeDetectorRef.markForCheck(),this._changeDetectorRef.detectChanges(),this._screenReaderAnnounce(),this._animationsDisabled?Ny(()=>{this._ngZone.run(()=>queueMicrotask(()=>this.onAnimationEnd(V)))},{injector:this._injector}):(clearTimeout(this._enterFallback),this._enterFallback=setTimeout(()=>{this._elementRef.nativeElement.classList.add(`mat-snack-bar-fallback-visible`),this.onAnimationEnd(V)},200)))}exit(){return this._destroyed?Th(void 0):(this._ngZone.run(()=>{this._animationState=`hidden`,this._changeDetectorRef.markForCheck(),this._elementRef.nativeElement.setAttribute(`mat-exit`,``),clearTimeout(this._announceTimeoutId),this._animationsDisabled?Ny(()=>{this._ngZone.run(()=>queueMicrotask(()=>this.onAnimationEnd(q)))},{injector:this._injector}):(clearTimeout(this._exitFallback),this._exitFallback=setTimeout(()=>this.onAnimationEnd(q),200))}),this._onExit)}ngOnDestroy(){this._destroyed=!0,this._clearFromModals(),this._completeExit()}_completeExit(){clearTimeout(this._exitFallback),queueMicrotask(()=>{this._onExit.next(),this._onExit.complete()})}_afterPortalAttached(){let t=this._elementRef.nativeElement,e=this.snackBarConfig.panelClass;e&&(Array.isArray(e)?e.forEach(r=>t.classList.add(r)):t.classList.add(e)),this._exposeToModals();let n=this._label.nativeElement,a=`mdc-snackbar__label`;n.classList.toggle(a,!n.querySelector(`.${a}`))}_exposeToModals(){let t=this._liveElementId,e=this._document.querySelectorAll(`body > .cdk-overlay-container [aria-modal="true"]`);for(let n=0;n<e.length;n++){let a=e[n],r=a.getAttribute(`aria-owns`);this._trackedModals.add(a),r?r.indexOf(t)===-1&&a.setAttribute(`aria-owns`,r+` `+t):a.setAttribute(`aria-owns`,t)}}_clearFromModals(){this._trackedModals.forEach(t=>{let e=t.getAttribute(`aria-owns`);if(e){let n=e.replace(this._liveElementId,``).trim();n.length>0?t.setAttribute(`aria-owns`,n):t.removeAttribute(`aria-owns`)}}),this._trackedModals.clear()}_assertNotAttached(){this._portalOutlet.hasAttached()}_screenReaderAnnounce(){this._announceTimeoutId||this._ngZone.runOutsideAngular(()=>{this._announceTimeoutId=setTimeout(()=>{if(this._destroyed)return;let t=this._elementRef.nativeElement,e=t.querySelector(`[aria-hidden]`),n=t.querySelector(`[aria-live]`);if(e&&n){let a=null;this._platform.isBrowser&&document.activeElement instanceof HTMLElement&&e.contains(document.activeElement)&&(a=document.activeElement),e.removeAttribute(`aria-hidden`),n.appendChild(e),a?.focus(),this._onAnnounce.next(),this._onAnnounce.complete()}},this._announceDelay)})}static ɵfac=function(e){return new(e||i)};static ɵcmp=(function(){let t=[`label`];function e(n,a){}return NE({type:i,selectors:[[`mat-snack-bar-container`]],viewQuery:function(a,r){if(a&1&&wp(ci,7)(t,7),a&2){let s;mI(s=yI())&&(r._portalOutlet=s.first),mI(s=yI())&&(r._label=s.first)}},hostAttrs:[1,`mdc-snackbar`,`mat-mdc-snack-bar-container`],hostVars:6,hostBindings:function(a,r){a&1&&vp(`animationend`,function(u){return r.onAnimationEnd(u.animationName)})(`animationcancel`,function(u){return r.onAnimationEnd(u.animationName)}),a&2&&Np(`mat-snack-bar-container-enter`,r._animationState===`visible`)(`mat-snack-bar-container-exit`,r._animationState===`hidden`)(`mat-snack-bar-container-animations-enabled`,!r._animationsDisabled)},features:[ip],decls:6,vars:3,consts:[[`label`,``],[1,`mdc-snackbar__surface`,`mat-mdc-snackbar-surface`],[1,`mat-mdc-snack-bar-label`],[`aria-hidden`,`true`],[`cdkPortalOutlet`,``]],template:function(a,r){a&1&&(ti(0,`div`,1)(1,`div`,2,0)(3,`div`,3),ap(4,e,0,0,`ng-template`,4),pc(),pp(5,`div`),pc()()),a&2&&(Qy(5),dp(`aria-live`,r._live)(`role`,r._role)(`id`,r._liveElementId))},dependencies:[ci],styles:[`@keyframes _mat-snack-bar-enter {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes _mat-snack-bar-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
.mat-mdc-snack-bar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  margin: 8px;
}
.mat-mdc-snack-bar-handset .mat-mdc-snack-bar-container {
  width: 100vw;
}

.mat-snack-bar-container-animations-enabled {
  opacity: 0;
}
.mat-snack-bar-container-animations-enabled.mat-snack-bar-fallback-visible {
  opacity: 1;
}
.mat-snack-bar-container-animations-enabled.mat-snack-bar-container-enter {
  animation: _mat-snack-bar-enter 150ms cubic-bezier(0, 0, 0.2, 1) forwards;
}
.mat-snack-bar-container-animations-enabled.mat-snack-bar-container-exit {
  animation: _mat-snack-bar-exit 75ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

.mat-mdc-snackbar-surface {
  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-sizing: border-box;
  padding-left: 0;
  padding-right: 8px;
}
[dir=rtl] .mat-mdc-snackbar-surface {
  padding-right: 0;
  padding-left: 8px;
}
.mat-mdc-snack-bar-container .mat-mdc-snackbar-surface {
  min-width: 344px;
  max-width: 672px;
}
.mat-mdc-snack-bar-handset .mat-mdc-snackbar-surface {
  width: 100%;
  min-width: 0;
}
@media (forced-colors: active) {
  .mat-mdc-snackbar-surface {
    outline: solid 1px;
  }
}
.mat-mdc-snack-bar-container .mat-mdc-snackbar-surface {
  color: var(--%NS%mat-snack-bar-supporting-text-color, var(--%NS%mat-sys-inverse-on-surface));
  border-radius: var(--%NS%mat-snack-bar-container-shape, var(--%NS%mat-sys-corner-extra-small));
  background-color: var(--%NS%mat-snack-bar-container-color, var(--%NS%mat-sys-inverse-surface));
}

.mdc-snackbar__label {
  width: 100%;
  flex-grow: 1;
  box-sizing: border-box;
  margin: 0;
  padding: 14px 8px 14px 16px;
}
[dir=rtl] .mdc-snackbar__label {
  padding-left: 8px;
  padding-right: 16px;
}
.mat-mdc-snack-bar-container .mdc-snackbar__label {
  font-family: var(--%NS%mat-snack-bar-supporting-text-font, var(--%NS%mat-sys-body-medium-font));
  font-size: var(--%NS%mat-snack-bar-supporting-text-size, var(--%NS%mat-sys-body-medium-size));
  font-weight: var(--%NS%mat-snack-bar-supporting-text-weight, var(--%NS%mat-sys-body-medium-weight));
  line-height: var(--%NS%mat-snack-bar-supporting-text-line-height, var(--%NS%mat-sys-body-medium-line-height));
}

.mat-mdc-snack-bar-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  box-sizing: border-box;
}

.mat-mdc-snack-bar-handset,
.mat-mdc-snack-bar-container,
.mat-mdc-snack-bar-label {
  flex: 1 1 auto;
}

.mat-mdc-snack-bar-container .mat-mdc-button.mat-mdc-snack-bar-action:not(:disabled).mat-unthemed {
  color: var(--%NS%mat-snack-bar-button-color, var(--%NS%mat-sys-inverse-primary));
}
.mat-mdc-snack-bar-container .mat-mdc-button.mat-mdc-snack-bar-action:not(:disabled) {
  --%NS%mat-button-text-state-layer-color: currentColor;
  --%NS%mat-button-text-ripple-color: currentColor;
}
.mat-mdc-snack-bar-container .mat-mdc-button.mat-mdc-snack-bar-action:not(:disabled) .mat-ripple-element {
  opacity: 0.1;
}
`],encapsulation:2,changeDetection:1})})()}return i})();var Et=new A(`mat-snack-bar-default-options`,{providedIn:`root`,factory:()=>new k});var kt=(()=>{class i{_live=C(Dt$1);_injector=C(re);_breakpointObserver=C(ie);_parentSnackBar=C(i,{optional:!0,skipSelf:!0});_defaultConfig=C(Et);_animationsDisabled=wi();_snackBarRefAtThisLevel=null;simpleSnackBarComponent=wt;snackBarContainerComponent=Bt;handsetCssClass=`mat-mdc-snack-bar-handset`;get _openedSnackBarRef(){let t=this._parentSnackBar;return t?t._openedSnackBarRef:this._snackBarRefAtThisLevel}set _openedSnackBarRef(t){this._parentSnackBar?this._parentSnackBar._openedSnackBarRef=t:this._snackBarRefAtThisLevel=t}openFromComponent(t,e){return this._attach(t,e)}openFromTemplate(t,e){return this._attach(t,e)}open(t,e=``,n){let a=G(G({},this._defaultConfig),n);return a.data={message:t,action:e},a.announcementMessage===t&&(a.announcementMessage=void 0),this.openFromComponent(this.simpleSnackBarComponent,a)}dismiss(){this._openedSnackBarRef&&this._openedSnackBarRef.dismiss()}ngOnDestroy(){this._snackBarRefAtThisLevel&&this._snackBarRefAtThisLevel.dismiss()}_attachSnackBarContainer(t,e){let n=e&&e.viewContainerRef&&e.viewContainerRef.injector,a=re.create({parent:n||this._injector,providers:[{provide:k,useValue:e}]}),r=new mt(this.snackBarContainerComponent,e.viewContainerRef,a),s=t.attach(r);return s.instance.snackBarConfig=e,s.instance}_attach(t,e){let n=G(G(G({},new k),this._defaultConfig),e),a=this._createOverlay(n),r=this._attachSnackBarContainer(a,n),s=new y(r,a);if(t instanceof ir){let u=new U(t,null,{$implicit:n.data,snackBarRef:s});s.instance=r.attachTemplatePortal(u)}else{let u=this._createInjector(n,s),gt=new mt(t,void 0,u);s.instance=r.attachComponentPortal(gt).instance}return this._breakpointObserver.observe(Ei.HandsetPortrait).pipe(Jh(a.detachments())).subscribe(u=>{a.overlayElement.classList.toggle(this.handsetCssClass,u.matches)}),n.announcementMessage&&r._onAnnounce.subscribe(()=>{this._live.announce(n.announcementMessage,n.politeness)}),this._animateSnackBar(s,n),this._openedSnackBarRef=s,this._openedSnackBarRef}_animateSnackBar(t,e){t.afterDismissed().subscribe(()=>{this._openedSnackBarRef==t&&(this._openedSnackBarRef=null),e.announcementMessage&&this._live.clear()}),e.duration&&e.duration>0&&t.afterOpened().subscribe(()=>t._dismissAfter(e.duration)),this._openedSnackBarRef?(this._openedSnackBarRef.afterDismissed().subscribe(()=>{t.containerInstance.enter()}),this._openedSnackBarRef.dismiss()):t.containerInstance.enter()}_createOverlay(t){let e=new Q;e.direction=t.direction;let n=ee(this._injector),a=t.direction===`rtl`,r=t.horizontalPosition===`left`||t.horizontalPosition===`start`&&!a||t.horizontalPosition===`end`&&a,s=!r&&t.horizontalPosition!==`center`;return r?n.left(`0`):s?n.right(`0`):n.centerHorizontally(),t.verticalPosition===`top`?n.top(`0`):n.bottom(`0`),e.positionStrategy=n,e.disableAnimations=this._animationsDisabled,oe(this._injector,e)}_createInjector(t,e){let n=t&&t.viewContainerRef&&t.viewContainerRef.injector;return re.create({parent:n||this._injector,providers:[{provide:y,useValue:e},{provide:_t,useValue:t.data}]})}static ɵfac=function(e){return new(e||i)};static ɵprov=dr({token:i,factory:i.ɵfac})}return i})();var Dt=(i,o)=>o.nombre;function Tt(i,o){if(i&1&&(ti(0,`p`,5),BI(1),pc()),i&2){let t=dI();Qy(),kp(t.error())}}function Ot(i,o){if(i&1){let t=uI();ti(0,`li`)(1,`span`,4),BI(2,`draft`),pc(),ti(3,`span`,8),BI(4),pc(),ti(5,`span`,9),BI(6),pc(),ti(7,`button`,10),vp(`click`,function(){let n=Wl(t).$implicit,a=dI();return Gl(a.quitar(n))}),ti(8,`span`,4),BI(9,`delete`),pc()()()}if(i&2){let t=o.$implicit,e=dI();Qy(4),kp(t.nombre),Qy(2),kp(e.peso(t.bytes)),Qy(),dp(`aria-label`,`Quitar `+t.nombre)}}function It(i,o){i&1&&(ti(0,`li`,6),BI(1,`Todavía no hay documentos suyos. El modelo usa solo la biblioteca pública.`),pc())}var vt=class i{api=C(ke);aviso=C(kt);archivos=Co([]);subiendo=Co(!1);error=Co(``);async ngOnInit(){await this.cargar()}async cargar(){try{this.archivos.set(await this.api.get(`/mis-documentos`))}catch(o){this.error.set(o.message)}}peso(o){return o<1048576?`${Math.max(1,Math.round(o/1024))} KB`:`${(o/1048576).toFixed(1)} MB`}async subir(o){let t=o.target,e=Array.from(t.files??[]);if(!e.length)return;this.subiendo.set(!0),this.error.set(``);let n=0;for(let a of e){let r=new FormData;r.append(`archivo`,a);try{await this.api.enviar(`POST`,`/mis-documentos`,r),n++}catch(s){this.error.set(`${a.name}: ${s.message}`)}}t.value=``,this.subiendo.set(!1),await this.cargar(),n&&this.aviso.open(n===1?`Documento añadido`:`${n} documentos a\xF1adidos`,void 0,{duration:3e3})}async quitar(o){try{await this.api.enviar(`DELETE`,`/mis-documentos/${encodeURIComponent(o.nombre)}`),await this.cargar(),this.aviso.open(`Documento quitado`,void 0,{duration:3e3})}catch(t){this.error.set(t.message)}}static ɵfac=function(t){return new(t||i)};static ɵcmp=NE({type:i,selectors:[[`app-mis-documentos`]],decls:17,vars:6,consts:[[1,`pagina`],[1,`ayuda`],[1,`subir`],[`type`,`file`,`accept`,`.txt,.md,.pdf,.docx`,`multiple`,``,3,`change`,`disabled`],[`aria-hidden`,`true`,1,`material-symbols-outlined`],[1,`error`],[1,`vacio`],[1,`nota`],[1,`nombre`],[1,`peso`],[`matIconButton`,``,3,`click`]],template:function(t,e){t&1&&(ti(0,`div`,0)(1,`h1`),BI(2,`Mis documentos`),pc(),ti(3,`p`,1),BI(4,`Documentos suyos que el modelo puede consultar además de la biblioteca pública: informes, notas, actas. Se quedan en esta computadora y no se suben a ningún sitio. Formatos: .txt, .md, .pdf y .docx.`),pc(),ti(5,`label`,2)(6,`input`,3),vp(`change`,function(a){return e.subir(a)}),pc(),ti(7,`span`,4),BI(8,`upload_file`),pc(),BI(9),pc(),JE(10,Tt,2,1,`p`,5),ti(11,`ul`),rI(12,Ot,10,3,`li`,null,Dt,!1,It,2,0,`li`,6),pc(),ti(15,`p`,7),BI(16,`Para que el modelo los use, pídale en el chat que busque en sus documentos, por ejemplo: «Busca en mis documentos lo que dice el acta de marzo».`),pc()()),t&2&&(Qy(5),Np(`ocupado`,e.subiendo()),Qy(),fp(`disabled`,e.subiendo()),Qy(3),vc(` `,e.subiendo()?`Añadiendo…`:`Añadir documentos`,` `),Qy(),eI(e.error()?10:-1),Qy(2),oI(e.archivos()))},dependencies:[gn,Rt],styles:[`.pagina[_ngcontent-%COMP%]{padding:32px clamp(16px,4vw,56px);max-width:760px}h1[_ngcontent-%COMP%]{font-size:32px}.ayuda[_ngcontent-%COMP%]{color:var(--%NS%vs-tenue);margin:6px 0 22px;max-width:64ch}.subir[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:8px;background:var(--%NS%vs-cobalto);color:#fff;border-radius:20px;padding:10px 20px;font-weight:500;cursor:pointer}.subir[_ngcontent-%COMP%]:focus-within{outline:2px solid var(--%NS%vs-cobalto);outline-offset:2px}.subir.ocupado[_ngcontent-%COMP%]{opacity:.7;cursor:progress}.subir[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]{position:absolute;width:1px;height:1px;opacity:0}ul[_ngcontent-%COMP%]{list-style:none;padding:0;margin:24px 0;background:var(--%NS%vs-hoja);border:1px solid var(--%NS%vs-borde);border-radius:10px}li[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 14px;border-bottom:1px solid #edf0f4}li[_ngcontent-%COMP%]:last-child{border-bottom:0}.nombre[_ngcontent-%COMP%]{flex:1;overflow:hidden;text-overflow:ellipsis}.peso[_ngcontent-%COMP%]{color:var(--%NS%vs-tenue);font-size:13px;font-variant-numeric:tabular-nums}.vacio[_ngcontent-%COMP%]{color:var(--%NS%vs-tenue);padding:16px 14px}.nota[_ngcontent-%COMP%]{color:var(--%NS%vs-tenue);font-size:14px}.error[_ngcontent-%COMP%]{color:#8c1d18}`]})};export{vt as MisDocumentos};