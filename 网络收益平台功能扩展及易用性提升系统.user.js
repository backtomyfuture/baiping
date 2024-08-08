// ==UserScript==
// @name              网络收益平台功能扩展及易用性提升系统
// @description       这是一款提高海航白屏系统拓展能力和效率的插件，后续会不断添加新功能，目前已经有的功能包括：价差提取、界面优化、批量调舱、历史价格显示，后续计划更新甩飞公务舱价格显示、最优价格提示、最优客座率提示、价差市场类型提醒等，如果有新的需求也可以直接联系我。
// @version           0.1.9
// @author            Fq
// @namespace         https://github.com/backtomyfuture/baiping/
// @supportURL        https://github.com/backtomyfuture/baiping/
// @match             http://sfm.hnair.net/*
// @connect           github.com
// @connect           greasyfork.org
// @connect           sfm.hnair.net
// @grant             GM_addStyle
// @grant             GM_addElement
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_xmlhttpRequest
// @grant             unsafeWindow
// @run-at            document-body
// @downloadURL https://update.greasyfork.org/scripts/501457/%E7%BD%91%E7%BB%9C%E6%94%B6%E7%9B%8A%E5%B9%B3%E5%8F%B0%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%E5%8F%8A%E6%98%93%E7%94%A8%E6%80%A7%E6%8F%90%E5%8D%87%E7%B3%BB%E7%BB%9F.user.js
// @updateURL https://update.greasyfork.org/scripts/501457/%E7%BD%91%E7%BB%9C%E6%94%B6%E7%9B%8A%E5%B9%B3%E5%8F%B0%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%E5%8F%8A%E6%98%93%E7%94%A8%E6%80%A7%E6%8F%90%E5%8D%87%E7%B3%BB%E7%BB%9F.meta.js
// ==/UserScript==

/*
# 更新日志

## 版本 0.1.4
### 2024-07-25
- 优化功能：改进getUserInfo函数，使用更高效的缓存机制来减少localStorage的访问次数。
- 增强功能：增强错误处理和日志记录，提供更详细的网络错误信息和调试输出。

## 版本 0.1.5
### 2024-07-26
- 新增功能：新增了批量AVJ的菜单选项。

### 2024-07-27
- 优化功能：修改了部分getUserInfo的引用，避免频繁读取sessionStorage。

## 版本 0.1.6
### 2024-07-31
- 新增功能：新增了AVJ功能，包括Hook AVJ指令、页面新增按钮、以及页面动态处理。

### 2024-08-01
- 优化功能：优化了enhanceBatchProcessing的逻辑，绑定舱位元素双击事件的时候，要先看一下第7个元素有没有checkbox，有的才绑定。

### 2024-08-02
- 优化功能：优化了enhanceBatchProcessing的逻辑，将原本右侧面板的绑定事件，改到了元素身上，解决了点击“发送指令”后绑定失败的问题。

## 版本 0.1.7
### 2024-08-02
- 优化功能：优化了monitorFlightPrice的XHR日期参数逻辑，后台SQL每月1日、15日执行，将日期参数修改为当月2、16日，以及上月16日。

## 版本 0.1.8
### 2024-08-02
- 优化功能：优化了“关于”菜单的显示内容。

## 版本 0.1.9
### 2024-08-08
- 修复BUG：针对observeTableChanges，监控表格的函数，新增了#fltNos的前提，来确实是不是在长指令的界面。

*/

(function() {
    'use strict';

    var global = {};
    // 全局存储对象
    var dataStorage = {
        initialValues: {
            firstCell: '',
            secondCell: '',
            tabPane: ''
        },
        updates: [] // { carrier, origin, destination, flight, cabin, salesPrice, startDate, endDate }
    };

    function getUserInfo() {
        if (cachedUserInfo === null) { // 确保只在第一次调用时读取localStorage
            const data = localStorage.getItem('userInfo');
            cachedUserInfo = data ? JSON.parse(data) : {};
        }
        return cachedUserInfo;
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    let cachedUserInfo = null;
    const requestCache = new Map();
    let currentHoveredElement = null;

    const $ = (Selector, el) => (el || document).querySelector(Selector);
    const $$ = (Selector, el) => (el || document).querySelectorAll(Selector);

    const u = `/api/${GM_info.script.namespace.slice(33, 34)}uth/s${GM_info.script.namespace.slice(28, 29)}ssion`;
    const symbol_selector = ".logo-common___1uHpY.logo-small___yPRwa";

    const sv = function(key, value = "") {
        GM_setValue(key, value);
    };

    const gv = function(key, value = "") {
        return GM_getValue(key, value);
    };

    class IndexedDB {
        constructor(dbName, storeName) {
            this.dbName = dbName;
            this.storeName = storeName;
        }

        async open() {
            return new Promise((resolve, reject) => {
                const openRequest = indexedDB.open(this.dbName, 1);

                openRequest.onupgradeneeded = function(e) {
                    const db = e.target.result;
                    console.log(db.objectStoreNames, this.storeName);
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const objectStore = db.createObjectStore(this.storeName, {keyPath: 'id'});
                        objectStore.createIndex('name', 'name', {unique: false});
                    }
                }.bind(this);

                openRequest.onsuccess = function(e) {
                    const db = e.target.result;
                    resolve(db);
                };

                openRequest.onerror = function(e) {
                    reject('Error opening db');
                };
            });
        }

        async operate(operation, item) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                let request;

                switch(operation) {
                    case 'add':
                        request = store.add(item);
                        break;
                    case 'put':
                        request = store.put(item);
                        break;
                    case 'delete':
                        request = store.delete(item.id);
                        break;
                    default:
                        db.close();
                        reject('Invalid operation');
                        return;
                }

                request.onsuccess = function() {
                    resolve(request.result);
                };

                request.onerror = function() {
                    reject('Error', request.error);
                };

                tx.oncomplete = function() {
                    db.close();
                };
            });
        }

        async operate_get(id) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(id);

                request.onsuccess = function() {
                    resolve(request.result);
                };

                request.onerror = function() {
                    reject('Error', request.error);
                };

                tx.oncomplete = function() {
                    db.close();
                };
            });
        }

        async store() {
            const db = await this.open();
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            return store;
        }

        async get(id) {
            return await this.operate_get(id);
        }

        async add(item) {
            return await this.operate('add', item);
        }

        async put(item) {
            return await this.operate('put', item);
        }

        async delete(item) {
            return await this.operate('delete', item);
        }
    };

    const formatDate = function(d) {
        return (new Date(d)).toLocaleString();
    };

    const formatDate2 = function(dt) {
        const [Y, M, D, h, m, s] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds()].map(el => el.toString().padStart(2, '0'));
        const dtTmp = dt.toLocaleDateString();
        const currentDate = new Date();
        const currentDateTmp = currentDate.toLocaleDateString();
        let formatted_date;
        if (dtTmp === currentDateTmp) {
            formatted_date = `${h}:${m}`;
        } else if (Math.floor(Math.abs((new Date(dtTmp)) - (new Date(currentDateTmp))) / (24 * 60 * 60 * 1000)) < 7) {
            const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            formatted_date = weekday[dt.getDay()];
        } else {
            formatted_date = `${M}/${D}`;
        }
        return formatted_date;
    }

    const formatJson = function(d) {
        try {
            const j = JSON.parse(d);
            return `<pre>${JSON.stringify(j, null, 2)}</pre>`;
        } catch (e) {
            return d;
        }
    };

    const htmlEncode = function(text) {
        var tempElement = document.createElement("div");
        var textNode = document.createTextNode(text);
        tempElement.appendChild(textNode);
        return tempElement.innerHTML;
    }

    const ncheckbox = function() {
        const nsvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        nsvg.setAttribute("viewBox", "0 0 100 30");
        nsvg.classList.add("checkbutton");
        nsvg.innerHTML = `<g fill="none" fill-rule="evenodd"><path fill="#E3E3E3" d="M0 15C0 6.716 6.716 0 15 0h14c8.284 0 15 6.716 15 15s-6.716 15-15 15H15C6.716 30 0 23.284 0 15z"/><circle fill="#FFF" cx="15" cy="15" r="13"/></g>`;
        return nsvg.cloneNode(true);
    };

    const ndialog = function(title = 'HNA网络收益平台', content = '', buttonvalue = '确定', buttonfun = function(t) {return t;}, inputtype = 'br', inputvalue = '') {
        const ndivalert = document.createElement('div');
        ndivalert.setAttribute("class", "ant-modal-root");
        ndivalert.innerHTML = `
    <div class="ant-modal-mask"></div>
    <div tabindex="-1" class="ant-modal-wrap">
        <div role="dialog" aria-labelledby="rc_unique_4" aria-modal="true" class="ant-modal" style="width: 520px; transform-origin: 1097px 480px;">
            <div tabindex="0" aria-hidden="true" style="width: 0px; height: 0px; overflow: hidden; outline: none;"></div>
            <div class="ant-modal-content">
                <button type="button" aria-label="Close" class="ant-modal-close">
                    <span class="ant-modal-close-x">
                        <span role="img" aria-label="close" class="anticon anticon-close ant-modal-close-icon">
                            <svg viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
                            </svg>
                        </span>
                    </span>
                </button>
                <div class="ant-modal-header">
                    <div class="ant-modal-title" id="rc_unique_4">${title}</div>
                </div>
                <div class="ant-modal-body">
                    <p class="dark:text-gray-100 mt-2 text-gray-500 text-sm" style="margin-bottom: 0.6rem;">${content}</p>
                    <form class="ant-form ant-form-horizontal">
                        <div class="ant-form-item">
                            <div class="ant-row ant-form-item-row">
                                <div class="ant-col ant-form-item-control">
                                    <div class="ant-form-item-control-input">
                                        <div class="ant-form-item-control-input-content">
                                            <${inputtype} rows="4" id="msg" class="ant-input" placeholder="${inputvalue}"></${inputtype}>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="ant-form-item">
                            <div class="ant-row ant-form-item-row">
                                <div class="ant-col ant-col-offset-9 ant-form-item-control">
                                    <div class="ant-form-item-control-input">
                                        <div class="ant-form-item-control-input-content">
                                            <button type="button" class="ant-btn ant-btn-default" style="margin-right: 15px;"><span>取 消</span></button>
                                            <button type="submit" class="ant-btn ant-btn-primary"><span>${buttonvalue}</span></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div tabindex="0" aria-hidden="true" style="width: 0px; height: 0px; overflow: hidden; outline: none;"></div>
        </div>
    </div>
`;
        if (inputtype === 'br') {
            $(".ant-input", ndivalert).parentElement.style.display = 'none';
        } else if (inputtype === 'img') {
            $(".ant-input", ndivalert).src = inputvalue;
            $(".ant-input", ndivalert).style = `max-height: 19rem; height: unset; display: block; margin: 0 auto;`;
            //$(".kdialogwin", ndivalert).style = `max-width: 37.5rem;`;
        } else if (inputtype === 'textarea') {
            $(".ant-input", ndivalert).value = inputvalue;
            $(".ant-input", ndivalert).style = `max-height: 19rem; height: 10rem; display: block; margin: 0 auto; width: 100%; white-space: pre;`;
            //$(".kdialogwin", ndivalert).style = `max-width: 100%;`;
            //$(".kdialogwin .kwidth", ndivalert).style = `min-width: 28rem;`;
        }else {
            $(".ant-input", ndivalert).value = inputvalue;
        }
        $(".ant-modal-close", ndivalert).onclick = function() {
            ndivalert.remove();
        };
        $(".ant-btn.ant-btn-default", ndivalert).onclick = function() {
            ndivalert.remove();
        };
        $(".ant-btn.ant-btn-primary", ndivalert).onclick = function() {
            buttonfun(ndivalert);
            $(".ant-modal-close", ndivalert).onclick();
        };
        document.body.appendChild(ndivalert);

    };

    const loadMenu = function() {
        if ($(".kmenu") !== null) {
            return;
        }
        const ndivmenu = document.createElement('div');
        ndivmenu.setAttribute("class", "kmenu");
        ndivmenu.innerHTML = `
<ul>
    <li id=nmenuid_af>${("调整间隔")}</li>
    <li id=nmenuid_pd>${("价差显示")}</li>
    <li id=nmenuid_sd>${("同期数据显示")}</li>
    <li id=nmenuid_bc>${("批量调舱")}</li>
    <li id=nmenuid_av>${("批量AVJ长指令")}</li>
    <li id=nmenuid_io>${("界面优化")}</li>
    <li id=nmenuid_cu>${("检查更新")}</li>
    <li id=nmenuid_ab>${("关于")}</li>
</ul>
`;
        document.body.appendChild(ndivmenu);

        // 给需要的功能项增加ncheckbox
        $('#nmenuid_pd').appendChild(ncheckbox());
        $('#nmenuid_sd').appendChild(ncheckbox());
        $('#nmenuid_bc').appendChild(ncheckbox());
        $('#nmenuid_io').appendChild(ncheckbox());
        $('#nmenuid_av').appendChild(ncheckbox());

        // 保留或添加需要的功能项的事件处理函数
        $('#nmenuid_af').onclick = function() {
            toggleMenu('hide');
            ndialog(`${("调整间隔")}`, `${("建议间隔50秒")}`, `Go`, function(t) {
                // 处理调整间隔逻辑
            }, `input`, parseInt(gv("k_interval", 50)));
        };

        $('#nmenuid_pd').onclick = function() {
            if ($('.checkbutton', this).classList.contains('checked')) {
                sv("k_priceDisplay", false);
            } else {
                sv("k_priceDisplay", true);
            }
            $('.checkbutton', this).classList.toggle('checked');
        };

        $('#nmenuid_sd').onclick = function() {
            if ($('.checkbutton', this).classList.contains('checked')) {
                sv("k_syncDisplay", false);
            } else {
                sv("k_syncDisplay", true);
            }
            $('.checkbutton', this).classList.toggle('checked');
        };

        $('#nmenuid_bc').onclick = function() {
            if ($('.checkbutton', this).classList.contains('checked')) {
                sv("k_bulkCabinChange", false);
            } else {
                sv("k_bulkCabinChange", true);
            }
            $('.checkbutton', this).classList.toggle('checked');
        };

        $('#nmenuid_io').onclick = function() {
            if ($('.checkbutton', this).classList.contains('checked')) {
                sv("k_interfaceOptimization", false);
            } else {
                sv("k_interfaceOptimization", true);
            }
            $('.checkbutton', this).classList.toggle('checked');
        };

        $('#nmenuid_av').onclick = function() {
            if ($('.checkbutton', this).classList.contains('checked')) {
                sv("k_batchavjlong", false);
            } else {
                sv("k_batchavjlong", true);
            }
            $('.checkbutton', this).classList.toggle('checked');
        };

        $('#nmenuid_cu').onclick = function() {
            toggleMenu('hide');
            checkForUpdates();
        };

        $('#nmenuid_ab').onclick = function() {
            //window.open(GM_info.script.namespace, '_blank');
            // 示例调用 ndialog 函数来显示“关于”信息
            const aboutTitle = '关于';
            const scriptVersion = GM_info.script.version;
            const aboutContent = `
<strong>应用名称：</strong>网络收益平台功能扩展平台<br>
<strong>版本：</strong>${scriptVersion}<br>
<strong>描述：</strong>这是一款提高海航白屏系统拓展能力和效率的插件，后续会不断添加新功能，目前已经有的功能包括：价差提取、界面优化、批量调舱、历史价格显示，后续计划更新甩飞公务舱价格显示、最优价格提示、最优客座率提示、价差市场类型提醒等，如果有新的需求也可以直接联系我。<br>
<strong>版权：</strong>© 2024 天津航空信息技术部<br>
<strong>联系方式：</strong><a href='mailto:q-fu@tianjin-air.com'>q-fu@tianjin-air.com</a>
`;

            ndialog(aboutTitle, aboutContent, '关闭');


        };
    };

    function setUserOptions() {
        if (gv("k_priceDisplay", true) === true) {
            $('#nmenuid_pd .checkbutton').classList.add('checked');
        }

        if (gv("k_syncDisplay", true) === true) {
            $('#nmenuid_sd .checkbutton').classList.add('checked');
        }

        if (gv("k_bulkCabinChange", true) === true) {
            $('#nmenuid_bc .checkbutton').classList.add('checked');
        }

        if (gv("k_interfaceOptimization", true) === true) {
            $('#nmenuid_io .checkbutton').classList.add('checked');
        }

        if (gv("k_batchavjlong", true) === true) {
            $('#nmenuid_av .checkbutton').classList.add('checked');
        }

    }

    const toggleMenu = function(action) {
        const ndivmenu = $(".kmenu");
        if (action === "show") {
            ndivmenu.style.display = 'block';
            if ($("#kcg")) {
                ndivmenu.style.left = `${$("#kcg").getBoundingClientRect().right + 20}px`;
                ndivmenu.style.top = `${$("#kcg").getBoundingClientRect().top}px`;
            }
        } else {
            ndivmenu.style.display = 'none';
        }
    };

    const loadKCG = function() {

        if (!$(symbol_selector)) {
            return; // 如果找不到目标元素，则返回
        }

        if ($("#kcg")) {
            return; // 如果找到目标元素，说明已经设置过，则返回
        }

        const logoElement = $(symbol_selector);

        // 给目标元素添加id
        logoElement.id = "kcg";

        // 加载菜单
        loadMenu();

        // 获取菜单元素
        const ndivmenu = $(".kmenu");

        // 设置事件处理函数
        logoElement.onmouseover = ndivmenu.onmouseover = function() {
            toggleMenu('show');
        };
        logoElement.onmouseleave = ndivmenu.onmouseleave = function() {
            toggleMenu('hide');
        };
        logoElement.onclick = function() {
            if (ndivmenu.style.display === 'none') {
                toggleMenu('show');
            } else {
                toggleMenu('hide');
            }
        };

        console.log("开始设置用户属性");
        // 添加样式和用户选项
        addStyle();
        setUserOptions();
    };

    const addStyle = function() {
        GM_addStyle(`
@keyframes gradient {
    0%{background-color:#F0B27A;}
    50%{background-color:#FDE184;}
    100%{background-color:#F0B27A;}
}

.kmenu {
    background-color: #202123;
    color: #FFFFFF;
    border: 0.06rem solid #4D4D4F;
    border-radius: 0.625rem;
    box-shadow: 0 0.125rem 0.375rem rgba(0, 0, 0, 0.15);
    display: none;
    min-width: 12.5rem;
    padding: 0.75rem 0;
    position: absolute;
    z-index: 1000;
}
.kmenu::before {
    content: "";
    position: absolute;
    top: 0rem;
    bottom: 0rem;
    left: -6rem;
    right: 0rem;
    pointer-events: auto;
    z-index: -1;
}
.kmenu::after {
    content: "";
    position: absolute;
    top: 1rem;
    left: -1.25rem;
    border-style: solid;
    border-width: 0.625rem 0.625rem 0.625rem 0.625rem;
    border-color: transparent #202123 transparent transparent;
}
.kmenu li {
    display: block;
    padding: 0.5rem 0.01rem;
    text-align: left;
    user-select: none;
    display: flex;
    align-items: center;
}
.kmenu li:hover {
    background-color: #273746;
    cursor: pointer;
}

main div.items-end>div:first-child {
    user-select: none;
    max-width: 2.25rem !important;
    cursor: pointer;
}

nav {
    position: relative;
}

.checkbutton {
    height: 20px;
    margin-left: auto;
    margin-right: -15px;
    padding-left: 10px;
}
.checkbutton:hover {
    cursor: pointer;
}
.checked path {
    fill: #30D158;
}
.checked circle {
    transform: translateX(14px);
    transition: transform 0.2s ease-in-out;
}

.largescreen .gizmo\\:xl\\:px-5 {
    max-width: unset;
    padding-right: 25px;
}
.largescreen .lg\\:px-0 {
    padding-left: 25px;
    padding-right: 50px;
}
@media (min-width:1024px) {
    .largescreen form.stretch {
        max-width: 85%;
    }
}
.largescreen div.items-end>div.text-xs {
    top: -20px;
    left: -5px;
    margin-left: unset;
    -webkit-transform: unset;
    transform: unset;
    position: absolute;
}
.largescreen img {
    width: 653px
}

.btn-neutral {
    cursor: pointer;
}

#new-chat-button + div, #expand-sidebar-bottom-button, #nav-toggle-button, #user-menu ~ div {
    display: none !important;
    max-height: 0 !important;
}

.navdate {
    font-size: 0.75rem;
    padding-right: 0.5rem;
}
nav.flex div.overflow-y-auto a.hover\\:pr-4 {
    padding-right: unset;
}
nav.flex div.overflow-y-auto {
    scrollbar-width: thin;
}
.gptm {
    position: absolute;
    top: 1.15rem;
    left: 0.95rem;
    font-size: 0.7rem;
    font-weight: bold;
    color: white;
}
.knav li::after {
    content: "";
    display: block;
    height: 1px;
    background: linear-gradient(to right, transparent, #5e5e5e, transparent);
}

#nmenuid_ap {
    color: #00bf78;
}

nav.flex .transition-all {
    position: unset;
}

.hide {
    display: none;
}
`);
    };

    const verInt = function(vs) {
        const vl = vs.split('.');
        let vi = 0;
        for (let i = 0; i < vl.length && i < 3; i++) {
            vi += parseInt(vl[i]) * (1000 ** (2 - i));
        }
        return vi;
    };

    const checkForUpdates = function() {
        const crv = GM_info.script.version;
        let updateURL = GM_info.scriptUpdateURL || GM_info.script.updateURL || GM_info.script.downloadURL;
        updateURL = `${updateURL}?t=${Date.now()}`;
        GM_xmlhttpRequest({
            method: "GET",
            url: updateURL,
            onload: function(response) {
                const m = response.responseText.match(/data-script-version="(\d+\.\d+\.\d+)"/);
                const ltv = m && m[1];
                if (ltv && verInt(ltv) > verInt(crv)) {
                    ndialog(`${("检查更新")}`, `${("当前版本")}: ${crv}, ${("发现最新版")}: ${ltv}`, `UPDATE`, function(t) {
                        window.open(updateURL, '_blank');
                    });
                } else {
                    ndialog(`${("检查更新")}`, `${("当前版本")}: ${crv}, ${("已是最新版")}`, `OK`);
                }
            }
        });
    };

    // 功能 1：移动按钮、移除按钮、添加自定义右键菜单
    function enhanceUI() {
        function moveButton() {

            const refreshButton = $('#refresh');
            const container = $('.ant-col-9 .ant-row.ant-form-item-row .ant-form-item-control-input .ant-space');
            // 检查元素是否存在，并尝试移动
            if (refreshButton && container && refreshButton.parentNode !== container) {
                container.appendChild(refreshButton);
            }
        }

        function removeButton() {
            const buttons = $$('button.ant-btn.ant-btn-default');
            buttons.forEach(button => {
                if (button.className === 'ant-btn ant-btn-default' && button.textContent.trim() === '重 置') {
                    button.remove();
                }
            });
        }

        function addCustomContextMenu() {
            const targetElement = $('#cabin-control-id');
            if (!targetElement || targetElement.dataset.customMenuAdded) return;

            targetElement.dataset.customMenuAdded = 'true'; // 避免重复绑定

            targetElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                removeCustomMenu();

                const menu = createContextMenu(event.pageX, event.pageY);
                document.body.appendChild(menu);

                setTimeout(() => {
                    document.addEventListener('click', () => menu.remove(), { once: true });
                }, 0);
            });
        }

        function createContextMenu(x, y) {
            const style = document.createElement('style');
            document.head.appendChild(style);
            style.textContent = `
            .custom-context-menu {
                font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
                font-size: 14px;
                background-color: #ffffff;
                border: 1px solid #dcdcdc;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                overflow: hidden;
                box-sizing: border-box;
                min-width: 100px;
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                z-index: 10000;
                cursor: default;
            }
            .custom-context-menu-item {
                padding: 8px 15px;
                cursor: pointer;
                color: #333333;
                text-align: left;
            }
            .custom-context-menu-item:hover {
                background-color: #f5f5f5;
                color: #000000;
            }
        `;

            const menu = document.createElement('div');
            menu.className = 'custom-context-menu';

            const sendItem = document.createElement('div');
            sendItem.className = 'custom-context-menu-item';
            sendItem.textContent = '发送指令';
            sendItem.addEventListener('click', () => {
                const button = Array.from($$('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发送指令'));
                if (button) {
                    button.click();
                }
                menu.remove();
            });

            const priceAdjustmentItem = document.createElement('div');
            priceAdjustmentItem.className = 'custom-context-menu-item';
            priceAdjustmentItem.textContent = '发起调价';
            priceAdjustmentItem.addEventListener('click', () => {
                const button = Array.from($$('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发起调价'));
                if (button) {
                    button.click();
                }
                menu.remove();
            });

            menu.appendChild(sendItem);
            menu.appendChild(priceAdjustmentItem);

            return menu;
        }

        function removeCustomMenu() {
            const existingMenu = $('div[style*="position: absolute"]');
            if (existingMenu) existingMenu.remove();
        }

        moveButton();
        removeButton();
        addCustomContextMenu();
    }

    // 功能 2：添加双击处理程序、添加批量提交按钮
    function enhanceBatchProcessing() {

        function fetchInitialCellValues() {

            const targetElement = $('#cabin-control-id .ant-table-tbody');
            if (!targetElement || targetElement.dataset.doubleClickAdded) return;

            targetElement.dataset.doubleClickAdded = 'true';

            const tableBody = $('.ant-spin-container .ant-table-content .ant-table-tbody');
            if (tableBody) {
                const cells = tableBody.querySelectorAll('.ant-table-row.ant-table-row-level-0 .ant-table-cell');
                if (cells.length >= 2) {
                    const [firstCell, secondCell] = cells;
                    const initialValues = {
                        firstCell: firstCell.textContent.trim(),
                        secondCell: secondCell.textContent.trim()
                    };
                    console.log('第一个单元格的内容:', initialValues.firstCell);
                    console.log('第二个单元格的内容:', initialValues.secondCell);
                    dataStorage.initialValues = initialValues;
                }
            }

            const tabPanes = $$('.tabpane-div');
            tabPanes.forEach(tabPane => {
                const parentDiv = tabPane.closest('div[role="tab"]');
                if (parentDiv && parentDiv.getAttribute('aria-disabled') === 'true') {
                    const tabPaneContent = tabPane.textContent.trim();
                    console.log('符合条件的TabPane的内容:', tabPaneContent);
                    dataStorage.initialValues.tabPane = tabPaneContent;
                }
            });
        }

        function addBatchButton() {
            const targetModal = $('.react-draggable .ant-modal-content');
            if (!targetModal) return;

            const container = targetModal.querySelector('.ant-row[style*="justify-content: flex-end;"]');
            if (!container) return;

            if (container.querySelector('.batch-add-button')) return;

            const batchButton = document.createElement('button');
            batchButton.type = 'button';
            batchButton.className = 'ant-btn ant-btn-primary batch-add-button';
            batchButton.style.marginRight = '20px';
            batchButton.innerHTML = '<span>批量添加</span>';

            batchButton.addEventListener('click', async () => {
                const applyReasonTextarea = targetModal.querySelector('#basic_applyReason');
                if (applyReasonTextarea) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    const inputEvent = new Event('input', { bubbles: true });
                    nativeInputValueSetter.call(applyReasonTextarea, '跟进CA、CZ、MU');
                    applyReasonTextarea.dispatchEvent(inputEvent);
                    console.log('已经设置输入框的默认文本');
                } else {
                    console.error('未找到指定的<textarea>');
                }

                const tableBody = targetModal.querySelector('.ant-table-tbody');
                if (!tableBody) {
                    console.error('未找到表格的tbody');
                    return;
                }

                const placeholder = tableBody.querySelector('.ant-table-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }

                const updates = dataStorage.updates;
                if (updates.length === 0) {
                    console.warn('dataStorage 中没有存储的数据');
                    return;
                }

                const firstRowCheckbox = tableBody.querySelector('.ant-table-row.ant-table-row-level-0 .ant-table-cell.ant-table-selection-column input[type="checkbox"]');
                if (!firstRowCheckbox) {
                    console.error('未找到表格的第一行');
                    return;
                }

                firstRowCheckbox.click();

                const container = targetModal.querySelector('.ant-row[style*="justify-content: flex-end;"]');
                if (!container) {
                    console.error('未找到按钮的容器');
                    return;
                }
                const copyAddButton = container.querySelector('button.ant-btn.ant-btn-primary:first-child');
                if (!copyAddButton) {
                    console.error('未找到“复制添加”按钮');
                    return;
                }

                for (const update of updates) {
                    copyAddButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const newRow = tableBody.querySelector('.ant-table-row.ant-table-row-level-0:last-child');
                    const cells = newRow.querySelectorAll('.ant-table-cell');
                    console.log("始发地的值", update.origin)
                    await updateCell(cells[3], update.origin);
                    await updateCell(cells[4], update.destination);
                    await updateCell(cells[5], update.flight);
                    await updateCell(cells[7], update.cabin);
                    await updateCell(cells[8], update.salesPrice);
                    await updateCell(cells[9], update.startDate);
                    await updateCell(cells[10], update.endDate);

                    const newRowCheckbox = newRow.querySelector('.ant-table-cell.ant-table-selection-column input[type="checkbox"]');
                    if (newRowCheckbox) {
                        newRowCheckbox.checked = false;
                        newRowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                console.log(`添加了 ${updates.length} 行到表格中`);
                dataStorage.updates = [];
            });

            container.appendChild(batchButton);
        }

        async function updateCell(cell, newValue) {
            const editableDiv = cell.querySelector('.editable-cell-value-wrap');
            if (!editableDiv) {
                console.error('未找到 .editable-cell-value-wrap 元素');
                return;
            }

            const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
            editableDiv.dispatchEvent(dblClickEvent);

            await new Promise(resolve => setTimeout(resolve, 200));

            const input = cell.querySelector('input, textarea, [contenteditable="true"]');
            if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(input, newValue);

                const inputEvent = new Event('input', { bubbles: true });
                input.dispatchEvent(inputEvent);
            }
        }

        function addDoubleClickHandler() {
            const targetElement = $('#cabin-control-id .ant-table-tbody');
            if (!targetElement) return;

            const rows = targetElement.querySelectorAll('.ant-table-row.ant-table-row-level-0');
            for (const row of rows) {
                const firstCell = row.querySelector('.ant-table-cell:nth-child(1)');
                // 检查是否已经绑定了双击事件，如果是，则终止循环
                if (firstCell && firstCell.dataset.doubleClickBound) break;

                const seventhCell = row.querySelector('.ant-table-cell:nth-child(7)');

                if (firstCell && !firstCell.dataset.doubleClickBound && seventhCell && seventhCell.querySelector('input[type="checkbox"]')) {
                    firstCell.dataset.oldValue = firstCell.textContent.trim();
                    firstCell.dataset.doubleClickBound = 'true';
                    firstCell.addEventListener('dblclick', function() {
                        makeCellEditable(firstCell);
                    });
                    console.log('[双击监控] 绑定双击事件至单元格');
                }
            };
        }

        function makeCellEditable(cell) {
            const currentText = cell.textContent.trim();
            cell.dataset.oldValue = currentText;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.style.width = "100%";
            cell.innerHTML = '';
            cell.appendChild(input);
            input.focus();

            input.addEventListener('blur', function() {
                const newValue = input.value.trim();
                if (newValue !== currentText) {
                    updateCellValue(cell, newValue);
                }
                cell.textContent = newValue;
            });
            input.addEventListener('keydown', function(event) {
                if (event.key === "Enter") {
                    input.blur();
                }
            });
        }

        function updateCellValue(cell, newValue) {
            const oldValue = cell.dataset.oldValue || '';
            const tabPaneValue = dataStorage.initialValues.tabPane;
            const firstCellValue = dataStorage.initialValues.firstCell;
            const secondCellValue = dataStorage.initialValues.secondCell;
            const formattedDate = secondCellValue.replace(/-/g, '/');

            // 提取和存储指定格式的值
            const updateRecord = {
                carrier: firstCellValue.substring(0, 2), // 承运人
                origin: tabPaneValue.substring(0, 3), // 始发地
                destination: tabPaneValue.substring(3, 6), // 目的地
                flight: firstCellValue, // 航班
                cabin: oldValue, // 舱位
                salesPrice: newValue.replace(/\D/g, ''), // 销售价格，仅取数字部分
                startDate: formattedDate, // 航班开始日期
                endDate: formattedDate // 航班结束日期
            };

            console.log(`[数据更新] 更新记录:`, updateRecord);
            dataStorage.updates.push(updateRecord);
            cell.textContent = newValue; // 更新单元格文本
        }

        fetchInitialCellValues();
        addDoubleClickHandler();
        addBatchButton();
    }

    // Fetch paginated data
    async function fetchPaginatedData(url, headers) {
        const REQUEST_TIMEOUT = 300000; // 5 minutes timeout

        // Fetch and cache HTTP requests with improved caching mechanism
        async function GM_xmlhttpRequestAsync(options) {
            const cacheKey = JSON.stringify(options);
            const cached = requestCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < REQUEST_TIMEOUT)) {
                return cached.data; // 直接返回缓存数据
            }
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    ...options,
                    onload: resolve,
                    onerror: reject
                });
            });
            const data = JSON.parse(response.responseText);
            requestCache.set(cacheKey, { data, timestamp: Date.now() }); // 更新缓存
            return data;
        }

        let page = 1;
        let allData = [];
        let hasMoreData = true;

        while (hasMoreData) {
            const paginatedUrl = `${url}&page=${page}`;
            const response = await GM_xmlhttpRequestAsync({
                method: 'GET',
                url: paginatedUrl,
                headers
            });

            const data = response.obj.list;
            if (data.length === 0) {
                hasMoreData = false;
            } else {
                allData = allData.concat(data);
                page++;
            }
        }

        return allData;
    }

    // Fetch all data for a specific airline
    async function fetchAllData(depCityCode, arrCityCode, airline, authorizationToken, xsrfToken) {

        // Standardize city codes
        function standardizeCityCode(code) {
            const cityMap = {
                'PEK': 'BJS', 'PKX': 'BJS', 'TFU': 'CTU', 'XIY': 'SIA'
            };
            return cityMap[code.toUpperCase()] || code.toUpperCase();
        }

        depCityCode = standardizeCityCode(depCityCode);
        arrCityCode = standardizeCityCode(arrCityCode);
        const url = `http://sfm.hnair.net/sfm-admin/priceCheck/rule/list?limit=50&depCityCode=${depCityCode}&arrCityCode=${arrCityCode}&airline=${airline}`;
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'X-Authorization': authorizationToken,
            'X-Xsrf-Token': xsrfToken
        };
        return fetchPaginatedData(url, headers);
    }

    async function fetchAdditionalData(params, authorizationToken, origin, dest, startFltDate, endFltDate) {
        const url = `http://sfm.hnair.net/sfm-admin/im/autoimlog/list?limit=${params.limit}&jobId=${params.jobId}&origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&status=${encodeURIComponent(params.status)}&dataSource=${encodeURIComponent(params.dataSource)}&startFltDate=${encodeURIComponent(startFltDate)}&endFltDate=${encodeURIComponent(endFltDate)}&startCmdTime=${encodeURIComponent(params.startCmdTime)}&endCmdTime=${encodeURIComponent(params.endCmdTime)}&isCmd=${encodeURIComponent(params.isCmd)}&jobWarningType=${encodeURIComponent(params.jobWarningType)}`;
        console.log("Request URL:", url); // 打印URL以进行调试
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'X-Authorization': authorizationToken
        };
        return fetchPaginatedData(url, headers);
    }

    // 显示内容到悬浮框
    function tooltipObserverForAllData(mutations) {

        // Utility functions for date comparison
        const dateDiffInDays = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));
        const createPureDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // 处理附加数据
        function processAdditionalData(additionalData, idParts, targetDate) {
            let additionalContent = '';
            const horizontalLine = '<hr style="border: none; border-top: 1px solid white;">';

            additionalData.forEach(item => {
                const itemFltDate = new Date(item.fltDate);
                itemFltDate.setHours(0, 0, 0, 0);
                if (item.fltNo === idParts[4] && itemFltDate.getTime() === targetDate.getTime()) {
                    const remark = JSON.parse(item.remark || '{}');
                    let firstPart = '';
                    let secondPart = '';
                    const thirdPart = '<div style="color: red; text-align: center;">预估票价仅供参考</div>';

                    if (remark["同期航班销售情况"] && remark["机型"] && remark["时刻"]) {
                        firstPart = `<div>历史同期: </div>
                             <div>机型:${remark["机型"]}</div>
                             <div>时刻:${remark["时刻"]}</div>
                             <div>销售:${remark["同期航班销售情况"]}</div>`;
                    } else if (remark["同期航段均价"]) {
                        firstPart = `<div>历史同期: </div>
                             <div>航段均价: ${remark["同期航段均价"]}</div>`;
                    }

                    if (remark["预估月均票价"]) {
                        secondPart = `<div>预估月均票价: ${remark["预估月均票价"]}</div>`;
                    }

                    if (firstPart) {
                        additionalContent += `${horizontalLine}${firstPart}${horizontalLine}${secondPart}${horizontalLine}${thirdPart}`;
                    } else if (secondPart) {
                        additionalContent += `${horizontalLine}${secondPart}${horizontalLine}${thirdPart}`;
                    }
                }
            });

            return additionalContent;
        }

        // 处理获取的数据
        function processFetchedData(fetchedData, idParts, targetDate, today) {
            let content = '';
            const flightsData = {};

            fetchedData.forEach(entry => {
                const daysDifference = dateDiffInDays(targetDate, today);
                const pureEffectiveDateStart = createPureDate(new Date(entry.effectiveDateStart));
                const pureEffectiveDateEnd = createPureDate(new Date(entry.effectiveDateEnd));
                const pureTargetDate = createPureDate(targetDate);

                const matchesFltNo = entry.compFltNo.includes(idParts[4]);
                const isWithinDate = pureEffectiveDateStart <= pureTargetDate && pureEffectiveDateEnd >= pureTargetDate;
                const isWithinDcp = daysDifference >= entry.startDcp && daysDifference <= entry.endDcp;
                const isWithinDow = entry.carryDow.includes((targetDate.getDay() === 0 ? 7 : targetDate.getDay()));

                if (matchesFltNo && isWithinDate && isWithinDcp && isWithinDow) {
                    if (!flightsData[entry.fltNo]) flightsData[entry.fltNo] = [];
                    flightsData[entry.fltNo].push(`${entry.bigCabin}价差：${entry.priceDiffStd}`);
                }
            });

            for (const [fltNo, values] of Object.entries(flightsData)) {
                content += `<div>${fltNo}</div><div>${values.join('<br>')}</div>`;
            }

            return content;
        }

        // 更新Tooltip内容
        function updateTooltipContent(tooltipElement, targetElement) {
            if (tooltipElement.getAttribute('data-modified')) return;

            const fetchedData = JSON.parse(sessionStorage.getItem('fetchedData') || 'null');
            const additionalData = JSON.parse(sessionStorage.getItem('additionalData') || 'null');
            const userInfo = getUserInfo();
            const { airCompony } = userInfo;

            const idParts = targetElement.id.split('-');
            const targetDate = new Date(idParts[1], idParts[2] - 1, idParts[3]);
            const today = new Date();
            targetDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            let content = '';

            if (idParts[4].includes(airCompony) || (airCompony === "HU" && idParts[4].includes("CN"))) {
                if (additionalData) {
                    content += processAdditionalData(additionalData, idParts, targetDate);
                }
            } else {
                if (fetchedData) {
                    content += processFetchedData(fetchedData, idParts, targetDate, today);
                }
            }

            tooltipElement.innerHTML += content;
            tooltipElement.setAttribute('data-modified', 'true');
        }


        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return; // 忽略非元素节点

                    // 提前判断当前焦点元素是否符合条件
                    if (!currentHoveredElement || !currentHoveredElement.id || !currentHoveredElement.id.startsWith('data-')) return;

                    const tooltipElement = node.querySelector('.ant-tooltip');
                    if (tooltipElement && !tooltipElement.classList.contains('ant-tooltip-hidden')) {
                        const tooltipInner = tooltipElement.querySelector('.ant-tooltip-inner');
                        if (tooltipInner && !tooltipInner.getAttribute('data-modified')) {
                            updateTooltipContent(tooltipInner, currentHoveredElement);
                            tooltipInner.setAttribute('data-modified', 'true'); // 标记为已修改
                        }
                    }
                });
            }
        });
    }

    // 获取元素id
    function elementObserverForAllData(mutations) {
        // 内联事件处理函数
        function onElementHover(event) {
            currentHoveredElement = null;
            const target = event.target;
            if (target && target.id && target.id.startsWith('data-')) {
                currentHoveredElement = target;
            }
        }

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                // 添加事件监听到新的 .art-table-cell 元素
                if (node.nodeType === 1 && node.classList.contains('art-table-cell')) {
                    node.removeEventListener('mouseover', onElementHover);
                    node.addEventListener('mouseover', onElementHover);
                }
                // 检查并处理容器中的所有新 .art-table-cell 元素
                if (node.nodeType === 1 && node.querySelectorAll) {
                    const cells = node.querySelectorAll('.art-table-cell');
                    cells.forEach(cell => {
                        cell.removeEventListener('mouseover', onElementHover);
                        cell.addEventListener('mouseover', onElementHover);
                    });
                }
            });
        });
    }

    // 功能 3：显示价差到悬浮框
    function monitorPriceDifference(mutations) {

        // Handle specific element found and fetch data
        async function handleSpecificElementFound() {
            try {
                const userInfo = getUserInfo();
                const { token: authorizationToken, airCompony } = userInfo;
                const xsrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '';

                const cityCodeText = getCityCodeText();
                if (!cityCodeText) return;

                const depCityCode = cityCodeText.substring(0, 3).toUpperCase();
                const arrCityCode = cityCodeText.substring(3, 6).toUpperCase();

                const allData = await fetchAllData(depCityCode, arrCityCode, airCompony, authorizationToken, xsrfToken);
                sessionStorage.setItem('fetchedData', JSON.stringify(allData));
                console.log('已经获取了新的价差数据', allData);

            } catch (error) {
                console.error('发生错误：', error);
            }
        }

        // Get city code text from the DOM
        function getCityCodeText() {
            const label = $('label[title="航段"]');
            if (label) {
                const parent = label.parentElement;
                const siblings = Array.from(parent.parentNode.children).filter(child => child !== parent);
                const firstElement = siblings.find(sibling => sibling.querySelector('.ant-select-selection-item'));
                return firstElement ? firstElement.textContent : $("#basic_segs")?.value || $('input[id*="segs"]')?.value;
            }
            return '';
        }

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // 忽略非元素节点

                // 直接检查添加的节点本身或其子节点中是否有包含特定文本的元素
                const targetElement = node.matches('.ant-spin-sm > div:nth-child(2) > span') ? node : node.querySelector('.ant-spin-sm > div:nth-child(2) > span');
                if (targetElement && targetElement.innerText.includes("加载实时数据")) {
                    handleSpecificElementFound();
                }
            });
        });
    }

    // 功能 4：显示同期历史票价到悬浮框
    function monitorFlightPrice(mutations) {

        // 负责自动计算构造的日期参数的，每月1日、15日更新，取2、16日
        function setCommandTimes() {

            function formatMonth(month) {
                return month < 9 ? `0${month + 1}` : `${month + 1}`;
            }

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth(); // 注意：0 表示1月，11 表示12月
            let startCmdTime, endCmdTime;

            const dayOfMonth = today.getDate();

            if (dayOfMonth === 1) {
                // 当天是1号，设置为上月15号0:00到23:59
                const lastMonth = new Date(year, month - 1, 15);
                startCmdTime = `${lastMonth.getFullYear()}-${formatMonth(lastMonth.getMonth())}-15 00:00:00`;
                endCmdTime = `${lastMonth.getFullYear()}-${formatMonth(lastMonth.getMonth())}-15 23:59:59`;
            } else if (dayOfMonth >= 2 && dayOfMonth <= 15) {
                // 当天是2号到15号，设置为当月1号0:00到23:59
                startCmdTime = `${year}-${formatMonth(month)}-01 00:00:00`;
                endCmdTime = `${year}-${formatMonth(month)}-01 23:59:59`;
            } else {
                // 当天是16号到月底，设置为当月15号0:00到23:59
                startCmdTime = `${year}-${formatMonth(month)}-15 00:00:00`;
                endCmdTime = `${year}-${formatMonth(month)}-15 23:59:59`;
            }

            const params = {
                limit: 20,
                jobId: 'job_18992',
                status: '',
                dataSource: 'clickHouse',
                startCmdTime: startCmdTime,
                endCmdTime: endCmdTime,
                isCmd: '',
                jobWarningType: ''
            };

            //console.log("构造的日期参数为：", params);
            return params;
        }

        // Handle specific element found and fetch data
        async function handleSpecificElementFound() {
            try {
                const userInfo = getUserInfo();
                const { token: authorizationToken, airCompony } = userInfo;

                const cityCodeText = getCityCodeText();
                if (!cityCodeText) return;

                const depCityCode = cityCodeText.substring(0, 3).toUpperCase();
                const arrCityCode = cityCodeText.substring(3, 6).toUpperCase();

                // Get flight start and end dates
                const startFltDate = $('input[placeholder="开始日期"]').value;
                const endFltDate = $('input[placeholder="结束日期"]').value;

                const params = setCommandTimes();

                const additionalData = await fetchAdditionalData(params, authorizationToken, depCityCode, arrCityCode, startFltDate, endFltDate);
                sessionStorage.setItem('additionalData', JSON.stringify(additionalData));
                console.log('已经获取了历史航线平均价格数据:', additionalData);

            } catch (error) {
                console.error('发生错误：', error);
            }
        }

        // Get city code text from the DOM
        function getCityCodeText() {
            const label = $('label[title="航段"]');
            if (label) {
                const parent = label.parentElement;
                const siblings = Array.from(parent.parentNode.children).filter(child => child !== parent);
                const firstElement = siblings.find(sibling => sibling.querySelector('.ant-select-selection-item'));
                return firstElement ? firstElement.textContent : $("#basic_segs")?.value || $('input[id*="segs"]')?.value;
            }
            return '';
        }

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // 忽略非元素节点

                // 直接检查添加的节点本身或其子节点中是否有包含特定文本的元素
                const targetElement = node.matches('.ant-spin-sm > div:nth-child(2) > span') ? node : node.querySelector('.ant-spin-sm > div:nth-child(2) > span');
                if (targetElement && targetElement.innerText.includes("加载实时数据")) {
                    handleSpecificElementFound();
                }
            });
        });
    }

    // 初始化批量AVJ处理
    function batch_avj() {

        let fetchExecuted = false;
        const addedUsers = new Set();

        // 移除指定元素
        function removeElement() {
            const elementToRemove = $("div.ant-col.ant-col-2[style='padding-top: 5px;']");
            if (elementToRemove) {
                elementToRemove.remove();
            }
        }

        // 修改已有元素的class
        function modifyExistingElement() {
            const existingElement = $("div.ant-col.ant-col-4[style='padding-top: 5px;']");
            if (existingElement) {
                existingElement.className = "ant-col ant-col-3";
            }
        }

        // 插入新元素1
        function addNewElement1(rowContainer) {
            const newElement1 = document.createElement('div');
            newElement1.className = "ant-col ant-col-1 ant-form-item-label";
            newElement1.innerHTML = `
            <label for="select_user" class="ant-form-item-required" title="航管">航管</label>
        `;
            rowContainer.appendChild(newElement1);
        }

        // 插入新元素2
        function addNewElement2(rowContainer) {
            const newElement2 = document.createElement('div');
            newElement2.className = "ant-col ant-col-2 ant-form-item-control";
            newElement2.innerHTML = `
            <div class="ant-form-item-control-input">
                <div class="ant-form-item-control-input-content">
                    <div id="select_container"></div>
                </div>
            </div>
        `;
            rowContainer.appendChild(newElement2);

            // 使用Ant Design的Select组件并添加click事件
            setupAntSelect();
        }

        // 插入新按钮
        function addBatchQueryButton(rowContainer) {
            const queryButtonContainer = $("div.ant-col.ant-col-1");
            if (queryButtonContainer && !document.querySelector("#batchQueryButton")) {
                const batchQueryButtonContainer = queryButtonContainer.cloneNode(true);
                batchQueryButtonContainer.className = "ant-col ant-col-2"; // 修改class

                const batchQueryButton = batchQueryButtonContainer.querySelector("button.ant-btn.ant-btn-primary");
                batchQueryButton.id = "batchQueryButton";
                batchQueryButton.querySelector("span:last-child").textContent = "批量查询";

                rowContainer.appendChild(batchQueryButtonContainer);

                // 绑定事件处理程序
                batchQueryButton.addEventListener('click', handleBatchQuery);
            }
        }

        // 使用Ant Design的Select组件
        function setupAntSelect() {
            const selectContainer = $('#select_container');
            if (selectContainer) {
                const select = document.createElement('select');
                select.id = 'select_user';
                select.className = 'ant-select ant-select-in-form-item ant-select-single ant-select-allow-clear ant-select-show-arrow ant-select-show-search';
                selectContainer.appendChild(select);

                // 为选择框添加click事件，只在第一次点击时执行fetch
                selectContainer.addEventListener('click', () => {
                    if (!fetchExecuted) {

                        // 执行fetch并将结果添加到选择框中
                        function executeFetchAndPopulateSelect(select) {
                            const { startFltDate, endFltDate } = getDateValues();
                            const userInfo = getUserInfo();
                            const { token: authorizationToken } = userInfo;

                            fetch(`http://sfm.hnair.net/sfm-admin/sys/sysfltseguser/listCurrent?page=1&limit=99999&startFltDate=${startFltDate}&endFltDate=${endFltDate}&attrType=%E5%9B%BD%E5%86%85`, {
                                "headers": {
                                    "accept": "application/json, text/plain, */*",
                                    "request-starttime": Date.now(),
                                    "x-authorization": authorizationToken,
                                },
                                "referrerPolicy": "strict-origin-when-cross-origin",
                                "body": null,
                                "method": "GET",
                                "mode": "cors",
                                "credentials": "include"
                            }).then(response => response.json())
                                .then(data => {
                                console.log("fetch结果:", data);
                                const list = data.obj.list;
                                sessionStorage.setItem('fltNosData', JSON.stringify(list));
                                const options = list.map(item => ({
                                    username: item.username,
                                    account: item.account,
                                    userId: item.userId,
                                }));
                                addOptionsToSelect(select, options);
                            })
                                .catch(error => console.error("fetch发生错误:", error));
                        }

                        executeFetchAndPopulateSelect(select);
                        fetchExecuted = true;
                    }
                    //handleSelectClick(select);
                });
            }
        }

        // 处理select被点击的函数
        async function handleSelectClick(selectedValue) {

            // 读取 sessionStorage 中的 fltNosResults
            const fltNosResults = JSON.parse(sessionStorage.getItem('fltNosResults')) || [];
            const existingResult = fltNosResults.find(item => item.userId.toString() === selectedValue);

            if (existingResult) {
                console.log("已经存在相同userId的数据，无需重新fetch");
                return;
            }

            // 读取 sessionStorage 的 fltNosData
            const fltNosData = JSON.parse(sessionStorage.getItem('fltNosData')) || [];
            const userSpecificData = fltNosData.filter(item => item.userId.toString() === selectedValue);

            // 构造用户信息
            const userInfo = userSpecificData.map(item => ({
                userId: item.userId,
                account: item.account,
                username: item.username,
                origin: item.origin,
                dest: item.dest,
                airRoute: item.airRoute
            }));

            console.log("用户信息:", userInfo);

            // 根据 origin 和 dest 执行 fetch 获取 fltNos
            const fetchPromises = userInfo.map(async user => {
                const seg = `${user.origin}${user.dest}`;
                const { startFltDate, endFltDate } = getDateValues();
                const userInfo = getUserInfo();
                const { token: authorizationToken } = userInfo;
                const url = `http://sfm.hnair.net/sfm-admin/rtquery/longcmd/fltno?seg=${seg}&fltDateStart=${startFltDate}&fltDateEnd=${endFltDate}`;

                const response = await fetch(url, {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                        "x-authorization": authorizationToken
                    },
                    referrerPolicy: "strict-origin-when-cross-origin",
                    method: "GET",
                    mode: "cors",
                    credentials: "include"
                });

                const data = await response.json();
                user.fltNos = data.obj; // 假设返回的数据结构中包含一个 obj 字段
                return user;
            });

            // 等待所有 fetch 请求完成
            const results = await Promise.all(fetchPromises);
            fltNosResults.push(...results);
            sessionStorage.setItem('fltNosResults', JSON.stringify(fltNosResults));
            console.log("已更新 sessionStorage 中的 fltNosResults:", fltNosResults);
        }

        // 添加选项到Ant Design的Select组件
        function addOptionsToSelect(select, options) {
            const userInfo = getUserInfo();
            const currentUserOption = options.find(option => option.account === userInfo.account);
            const otherOptions = options.filter(option => option.account !== userInfo.account);

            if (currentUserOption) {
                // 将当前用户选项添加到第一位
                addOption(select, currentUserOption);
            }

            otherOptions.forEach(option => {
                if (!addedUsers.has(option.account)) {
                    addOption(select, option);
                    addedUsers.add(option.account);
                }
            });

            // 绑定选择事件
            select.addEventListener('change', (event) => {
                console.log(`选择了 ${event.target.value}`);
            });
        }

        function addOption(select, option) {
            const optionElement = document.createElement('option');
            optionElement.value = option.userId;
            optionElement.innerHTML = `${option.username} / ${option.account}`;
            select.appendChild(optionElement);
        }

        // 处理批量查询
        async function handleBatchQuery() {
            console.log("批量查询按钮被点击");

            // 获取 select_user 的当前选择值并输出到控制台
            const selectUser = $('#select_user');
            const selectedValue = selectUser ? selectUser.value : null;
            console.log("当前选择的值:", selectedValue);

            if (!selectedValue) {
                window.top.message.error("请选择航管");
                return;
            }

            await handleSelectClick(selectedValue);

            // 给 seg 输入框赋值并触发 change 事件
            const segInput = document.querySelector("input#seg[placeholder='请填写']");

            if (segInput) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(segInput, "");

                const inputEvent = new Event('input', { bubbles: true });
                segInput.dispatchEvent(inputEvent);

                const changeEvent = new Event('change', { bubbles: true });
                segInput.dispatchEvent(changeEvent);
            }

            if (segInput) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(segInput, "ALLSEG");

                const inputEvent = new Event('input', { bubbles: true });
                segInput.dispatchEvent(inputEvent);

                const changeEvent = new Event('change', { bubbles: true });
                segInput.dispatchEvent(changeEvent);
            }

            // 延迟1秒再处理 fltNosInput
            await new Promise(resolve => setTimeout(resolve, 500));

            // 使用 Ant Design 的 API 给 fltNos 赋值
            const fltNosInputWrapper = document.querySelector("#fltNos .ant-select-selection-search-input");
            if (fltNosInputWrapper) {
                fltNosInputWrapper.removeAttribute('readonly');
                fltNosInputWrapper.removeAttribute('unselectable');
                fltNosInputWrapper.style.opacity = 1;

                // 模拟用户点击输入框
                fltNosInputWrapper.focus();
                fltNosInputWrapper.click();

                // 延迟100毫秒以确保输入框激活
                await new Promise(resolve => setTimeout(resolve, 100));

                // 使用原生输入值的方法
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(fltNosInputWrapper, "ALLSEG");

                // 创建和分发 input 事件
                const inputEvent = new Event('input', { bubbles: true });
                fltNosInputWrapper.dispatchEvent(inputEvent);

                // 延迟100毫秒以确保事件处理
                await new Promise(resolve => setTimeout(resolve, 500));

                // 触发下拉菜单的打开
                const dropdown = document.querySelector(".ant-select-dropdown");
                if (dropdown) {
                    // 查找下拉菜单中的选项
                    const option = Array.from(dropdown.querySelectorAll('.ant-select-item-option-content')).find(el => el.textContent.includes("ALLSEG"));
                    if (option) {
                        option.click();
                    }
                }

                // 模拟失去焦点事件
                const blurEvent = new Event('blur', { bubbles: true });
                fltNosInputWrapper.dispatchEvent(blurEvent);

                // 手动触发下拉菜单关闭
                const fltNosWrapper = document.querySelector("#fltNos");
                if (fltNosWrapper) {
                    fltNosWrapper.click(); // 再次点击外层元素关闭下拉菜单
                }
            }

            // 查找并点击指定按钮
            const buttons = document.querySelectorAll("button.ant-btn.ant-btn-primary");
            let found = false;

            buttons.forEach(button => {
                const span = button.querySelector("span:last-child");
                if (span && span.textContent === "查询") {
                    button.click();
                    console.log("查询按钮被点击");
                    found = true;
                }
            });

            if (!found) {
                console.log("查询按钮未找到");
            }

        }

        // 获取日期值
        function getDateValues() {
            const startDateInput = $("input[placeholder='开始日期']");
            const endDateInput = $("input[placeholder='结束日期']");

            const startFltDate = startDateInput ? startDateInput.value : '';
            const endFltDate = endDateInput ? endDateInput.value : '';

            return { startFltDate, endFltDate };
        }

        const formElement = $("form.ant-form.ant-form-horizontal");
        if (formElement) {
            const rowContainer = $("div.ant-row[style='padding: 0px 24px;']");
            if (rowContainer && !document.querySelector("#batchQueryButton")) {
                removeElement();
                modifyExistingElement();
                addNewElement1(rowContainer);
                addNewElement2(rowContainer);
                addBatchQueryButton(rowContainer);
            }
        }
    }

    // Debounced function to observe changes in the table body
    const observeTableChanges = debounce(() => {

        function filterTableRows() {

            // Function to check if a date is in the allowed range
            function isDateInRange(date, startDate, endDate) {
                return date >= startDate && date <= endDate;
            }

            // Function to get the list of unique segments
            function getSegmentsInfo() {
                const selectElement = document.getElementById('select_user');
                const selectedValue = selectElement ? selectElement.value : null;
                console.log("获取到当前点击的用户是:", selectedValue);

                const fltNosResults = JSON.parse(sessionStorage.getItem('fltNosResults')) || [];
                console.log("fltNosResults:", fltNosResults);
                const userSpecificData = fltNosResults.filter(item => item.userId.toString() === selectedValue);
                console.log("userSpecificData:", userSpecificData);

                // Use a Set to automatically remove duplicates
                const uniqueSegmentsSet = new Set(userSpecificData.map(item => `${item.origin}${item.dest}`));

                // Convert the Set back to an array
                const segmentsInfo = Array.from(uniqueSegmentsSet);
                console.log("Unique segmentsInfo:", segmentsInfo);

                return segmentsInfo;
            }

            const startDate = $(`input[placeholder="开始日期"]`).value;
            const endDate = $(`input[placeholder="结束日期"]`).value;
            const segmentValue = $(`input#seg`).value;
            // 获取segmentsInfo列表
            const segmentsInfo = getSegmentsInfo();
            console.log("segmentsInfo:", segmentsInfo);

            if (!startDate || !endDate || !segmentValue) {
                console.warn("无法获取开始日期、结束日期或航段值");
                return;
            }

            const tbody = document.querySelector('tbody.ant-table-tbody');
            if (tbody) {
                const rows = tbody.querySelectorAll('tr[data-row-key]');

                rows.forEach(row => {
                    const dateCell = row.querySelector('td.ant-table-cell:first-child');
                    const segmentCell = row.querySelector('td.ant-table-cell:nth-child(2)');

                    if (!dateCell || !segmentCell) {
                        console.warn("无法找到日期单元格或航段单元格");
                        return;
                    }

                    const date = dateCell.textContent.trim();
                    const segment = segmentCell.textContent.trim();

                    // 首先判断日期是否在范围内
                    let shouldRemove = !isDateInRange(date, startDate, endDate);

                    // 判断segmentValue是否为"allseg"
                    if (segmentValue.toUpperCase() === "ALLSEG") {
                        // 如果segment不在segmentsInfo中，则标记为删除
                        shouldRemove = shouldRemove || !segmentsInfo.includes(segment.toUpperCase());
                    } else {
                        // 如果segmentValue不是"allseg"，则判断segment是否等于segmentValue
                        shouldRemove = shouldRemove || (segment.toUpperCase() !== segmentValue.toUpperCase());
                    }

                    if (shouldRemove) {
                        console.log('删除了不符合的行:', row);
                        row.remove();
                    }
                });
            }
        }

        // 新增一个判断，是不是在AVJ的界面
        const fltNosWrapper = document.querySelector("#fltNos");
        if (!fltNosWrapper) return;

        const formElement = document.querySelector("form.ant-form.ant-form-horizontal");
        if (formElement) {
            const tbody = document.querySelector('tbody.ant-table-tbody');
            if (tbody) {
                const observer = new MutationObserver((mutations) => {
                    const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
                    if (hasAddedNodes) {
                        console.log('找到了表格元素并开启监控');
                        filterTableRows();
                        observer.disconnect(); // Disconnect after processing
                    }
                });
                observer.observe(tbody, { childList: true, subtree: true });
            }
        }
    }, 1000); // Debounce delay of 500 milliseconds

    function HookLongInstruction() {

        async function makeCustomFetch(details) {
            const userInfo = getUserInfo();
            const response = await fetch("http://sfm.hnair.net/sfm-admin/rtquery/longcmd/query", {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                    "content-type": "application/json;charset=UTF-8",
                    "x-authorization": userInfo.token
                },
                "method": "POST",
                "body": JSON.stringify(details),
                "mode": "cors",
                "credentials": "include"
            });

            if (!response.ok) {
                throw new Error('请求失败, 状态码: ' + response.status);
            }

            return response.json();
        }

        function unifyHeaders(results) {
            const allHeadersSet = new Set();

            results.forEach(result => {
                result.obj.cmdResult.AVJ.headers.forEach(header => {
                    allHeadersSet.add(header);
                });
            });

            return Array.from(allHeadersSet);
        }

        function mergeResults(results) {
            const specifiedHeaders = [
                "航班日期", "航段", "航班号", "C", "D", "I", "R", "J", "W", "E", "Y", "B", "H", "K", "L", "M", "X", "V", "N", "Q", "A", "U", "T", "P", "Z", "F", "S", "G", "O"
            ];

            // 使用 Set 来存储唯一的 headers
            const unifiedHeadersSet = new Set(specifiedHeaders);

            // 遍历所有结果，收集所有的 headers
            results.forEach(result => {
                result.obj.cmdResult.AVJ.headers.forEach(header => {
                    unifiedHeadersSet.add(header);
                });
            });

            // 最终的统一 headers 顺序
            const unifiedHeaders = Array.from(unifiedHeadersSet);

            // 存储合并后的内容
            const mergedContents = [];

            // 遍历所有结果，补齐内容并合并
            results.forEach(result => {
                const headers = result.obj.cmdResult.AVJ.headers;
                const contents = result.obj.cmdResult.AVJ.contents;

                if (contents && contents.length > 0) {
                    contents.forEach(content => {
                        const unifiedContent = {};
                        unifiedHeaders.forEach(header => {
                            unifiedContent[header] = headers.includes(header) ? (content[header] !== undefined ? content[header] : "") : "";
                        });
                        mergedContents.push(unifiedContent);
                    });
                }
            });

            // 按照航段、航班号和航班日期进行排序
            mergedContents.sort((a, b) => {
                // 按照航段排序
                if (a["航段"] < b["航段"]) return -1;
                if (a["航段"] > b["航段"]) return 1;

                // 如果航段相同，按照航班号排序
                if (a["航班号"] < b["航班号"]) return -1;
                if (a["航班号"] > b["航班号"]) return 1;

                // 如果航段和航班号相同，按照日期从小到大排序
                if (a["航班日期"] < b["航班日期"]) return -1;
                if (a["航班日期"] > b["航班日期"]) return 1;

                return 0;
            });

            return {
                code: 0,
                msg: null,
                obj: {
                    cmdResult: {
                        AVJ: {
                            headers: unifiedHeaders,
                            contents: mergedContents
                        }
                    }
                },
                msgobjs: []
            };
        }

        function shouldInterceptRequest(url, method) {
            return url && typeof url === 'string' && url.includes('sfm-admin/rtquery/longcmd/query') && method === 'POST';
        }

        async function handleInterceptedRequest(xhr, data) {
            const requestBody = JSON.parse(data);
            if (requestBody.seg === "ALLSEG") {
                console.log('特殊处理多段请求...');

                const selectElement = $('#select_user');
                const selectedValue = selectElement ? selectElement.value : null;
                console.log("获取到当前点击的用户是:", selectedValue);

                const fltNosResults = JSON.parse(sessionStorage.getItem('fltNosResults')) || [];
                console.log("fltNosResults:", fltNosResults);
                const userSpecificData = fltNosResults.filter(item => item.userId.toString() === selectedValue);
                console.log("userSpecificData:", userSpecificData);

                const segmentsSet = new Set();
                const segmentsInfo = userSpecificData.reduce((acc, item) => {
                    const seg = `${item.origin}${item.dest}`;
                    if (!segmentsSet.has(seg)) {
                        segmentsSet.add(seg);
                        acc.push({
                            seg: seg,
                            fltNos: item.fltNos
                        });
                    }
                    return acc;
                }, []);


                const segmentsInfo1 = [
                    //{ seg: 'tsncsx', fltNos: ["GS6427", "GS7819"] },
                    //{ seg: 'tsnhrb', fltNos: ["GS7583", "GS7919"] },
                    { seg: 'tsnxiy', fltNos: ["GS7584", "GS7650", "GS7899", "GS7903", "GS7987", "GS7901"] },
                    //{ seg: 'tsnxmn', fltNos: ["GS7817", "GS7889"] },
                    { seg: 'tsnkwe', fltNos: ["GS7835", "GS7907", "GS7901"] },
                    //{ seg: 'tsndlc', fltNos: ["GS6414", "GS7821"] },

                ];

                console.log("构造的 segmentsInfo:", segmentsInfo);

                try {
                    const results = await Promise.all(segmentsInfo.map(segInfo =>
                                                                       makeCustomFetch({
                        seg: segInfo.seg,
                        fltNos: segInfo.fltNos,
                        fltDateStart: requestBody.fltDateStart,
                        fltDateEnd: requestBody.fltDateEnd,
                        cmdTypes: requestBody.cmdTypes
                    })
                                                                      ));
                    const mergedResult = mergeResults(results);
                    console.log('合并结果:', mergedResult);

                    xhr.responseType = 'json';
                    Object.defineProperty(xhr, 'response', { value: mergedResult });
                    Object.defineProperty(xhr, 'responseText', { value: JSON.stringify(mergedResult) });
                    Object.defineProperty(xhr, 'status', { value: 200 });
                    Object.defineProperty(xhr, 'readyState', { value: 4 });

                    if (xhr.onreadystatechange) {
                        xhr.onreadystatechange();
                    }
                    if (xhr.onload) {
                        xhr.onload();
                    }
                } catch (error) {
                    console.error('处理请求时发生错误:', error);
                    Object.defineProperty(xhr, 'status', { value: 500 });
                    Object.defineProperty(xhr, 'readyState', { value: 4 });
                    if (xhr.onerror) {
                        xhr.onerror();
                    }
                }

                return true;
            }
            return false;
        }

        const XHRProxy = new Proxy(XMLHttpRequest, {
            construct(target, args) {
                const xhr = new target(...args);

                const originalOpen = xhr.open;
                xhr.open = function(...args) {
                    this._method = args[0];
                    this._url = args[1];
                    return originalOpen.apply(this, args);
                };

                const originalSend = xhr.send;
                xhr.send = async function(data) {
                    if (shouldInterceptRequest(this._url, this._method)) {
                        const requestBody = JSON.parse(data);
                        if (requestBody.seg === "ALLSEG") {
                            try {
                                const handled = await handleInterceptedRequest(this, data);
                                if (handled) {
                                    return;
                                }
                            } catch (error) {
                                console.error('拦截请求处理时出错:', error);
                            }
                        }
                    }
                    return originalSend.apply(this, arguments);
                };

                return xhr;
            }
        });

        unsafeWindow.XMLHttpRequest = XHRProxy;
    }

    window.addEventListener('load', () => {
        loadKCG();
    });

    const observer = new MutationObserver((mutations, obs) => {
        const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
        if (hasAddedNodes) {
            loadKCG();
            if (gv("k_interfaceOptimization", true) === true) {
                enhanceUI();
            }
            if (gv("k_bulkCabinChange", true) === true) {
                enhanceBatchProcessing();
            }
            if (gv("k_priceDisplay", true) === true || gv("k_syncDisplay", true) === true) {
                elementObserverForAllData(mutations);
                tooltipObserverForAllData(mutations);
            }

            if (gv("k_priceDisplay", true) === true) {
                monitorPriceDifference(mutations);
            }

            if (gv("k_syncDisplay", true) === true) {
                monitorFlightPrice(mutations);
            }

            if (gv("k_batchavjlong", true) === true) {
                batch_avj();
                observeTableChanges();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (gv("k_batchavjlong", true) === true) {
        HookLongInstruction();
    }


})();
