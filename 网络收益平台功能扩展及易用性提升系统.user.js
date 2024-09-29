// ==UserScript==
// @name              网络收益平台功能扩展及易用性提升系统
// @description       这是一款提高海航白屏系统拓展能力和效率的插件，后续会不断添加新功能，目前已经有的功能包括：价差提取、界面优化、批量调舱、历史价格显示，后续计划更新甩飞公务舱价格显示、最优价格提示、最优客座率提示、价差市场类型提醒等，如果有新的需求也可以直接联系我。
// @version           1.0.3
// @author            q-fu
// @namespace         https://github.com/backtomyfuture/baiping/
// @supportURL        https://nas.tianjin-air.com/drive/d/s/zsZUD2GpJIUSfEKSwH8zeSpVcY5T9Dtp/A3hbpQRrvngJb0749HdJfptBYNvXVnkj-9scAiaQHoAs
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

## 版本 0.1.10
### 2024-08-08
- 修复BUG：优化checkForUpdates，检查时候使用updateURL提速，下载时候使用downloadURL。

## 版本 0.1.11
### 2024-08-19
- 优化功能：修改elementObserverForAllData，以便适应鼠标在不同元素上悬浮时候，同样会触发到元素id字段；
- 新增功能：新增鼠标放置在经济舱价格、公务舱价格，目前的index设置为11、12，会获取页面所有航班价格；
- 新增功能：修改tooltipObserverForAllData，新增了getLowestPrice函数，获取最低价格;
- 优化功能：优化了fetchAllData的参数，增加了初始日期和截止日期，减少对系统的压力；

## 版本 0.1.12
### 2024-08-20
- 优化功能：getLowestPrice的逻辑，匹配的时候要对应targetDate；
- 新增功能：新增initIndices，在航班调整页面初始化的时候，设置不同元素的index；

## 版本 0.1.13
### 2024-08-20
- 优化功能：部分代码未更新，导致异常，重新将代码同步到最新；

## 版本 0.1.14
### 2024-08-21
- 优化功能：新增了抓取价差时，将PVG对应到SHA；

## 版本 0.1.15
### 2024-08-22
- 优化功能：新增globalFetchedData、globalAdditionalData全局变量，取代sessionStorage中存入和读取的操作，提高性能；
- 优化功能：tooltipObserverForAllData从sessionstorage中读取userinfo的操作，使用了getUserInfo来替代；
- 优化功能：updateCellValue中salesPrice的定义做了更新，提高安全性；
- 优化功能: 初始化功能放到window.load里边；

## 版本 0.1.16
### 2024-08-22
- 优化功能：去掉了全局的data，在sessionStorage中新增cabinPricePolicyStorage，存储舱位价格数据；
- 新增功能：新增updateInitialPrices，在打开RO界面时候，可以显示已经调整过的价格；
- 优化功能：addDoubleClickHandler和makeCellEditable，现在双击以后只能编辑价格部分，不能编辑舱位，同时颜色标识为红色；

## 版本 0.1.17
### 2024-08-26
- 优化功能：舱位单元格输入非数字，提示错误；
- 优化功能：提高了批量调舱的延时，到400ms和500ms；
- 优化功能：将清空历史数据的触发按钮由批量添加改到了下一步；

## 版本 0.1.18
### 2024-08-26
- 优化功能：在updateCabinPricePolicy的时候，增加了很多验证，来确保数据正确，如果数据不对，是用window.top.message来提示错误，同时不会保存；
- 优化功能：减少了批量调舱的延时，到300ms；

## 版本 0.1.19
### 2024-08-27
- 优化功能：新增isTooltipContentNotValid，判断修改tooltip内容排除sql自动化执行的框；

## 版本 0.1.20
### 2024-08-28
- 新增功能：新增用户手册；

## 版本 0.1.21
### 2024-08-29
- 优化功能：将initialValues放到全局变量，以解决刷新页面后，不会重新获取initialValues导致报错的问题；

## 版本 0.1.22
### 2024-09-02
- 优化功能：批量调舱功能，标记已经调整过的舱位、价格，增加了粗体显示；
- 优化功能：优化了批量调舱右击悬浮菜单的样式，以便和左侧即将做的排除航班右击菜单一致；
- 优化功能：重构了右击下拉菜单的方式，增加了全局变量currentMenuId，来避免不同页面右击下拉菜单导致的冲突；

## 版本 0.1.23
### 2024-09-13
- 新增功能：新增了航班调整页面左侧面板的右击下拉菜单，同时统一了右侧RO面板的下拉菜单，使用统一的函数来作用；
- 新增功能：新增了系统级的antDesignOperations，用来操作页面控件的输入，暂时包括日期、下拉单选菜单、input以及fillTextArea；
- 新增功能：新增了快捷航班排除功能，可以将航班信息带入到航班排除页面；
- 优化功能：将右击下拉菜单的功能从“页面优化”大功能拆出来；

## 版本 0.1.24
### 2024-09-14
- 优化功能：修复了快捷跳转的hook对原来批量avj hook的影响，两个功能合并为一个；
- 优化功能：优化了日期输入框和下拉菜单输入框的模式，减少了延时；

## 版本 0.1.25
### 2024-09-16
- 新增功能：新增成本价格显示；

## 版本 1.0.0
### 2024-09-18
- 新增功能：对整个版本进行重构，模块化整个代码结构；

## 版本 1.0.1
### 2024-09-18
- 优化功能：重构了menuManager代码，精简函数，简化流程；
- 优化功能：优化了longInstruction中关于should***Request的判断逻辑，添加了core.isFeatureEnabled；
- 优化功能：将excludeFlight中的delay放到core中；
- 优化功能：将batchPolicy中的updateTableCell，放到uiOperations中;
- 优化功能：优化了uiOperations，增加了setTimeout(resolve, 100);
- 优化功能：优化batchPolicy，使用localstorage来存储，避免多浏览器以及跨浏览器页签导致的数据错乱问题;
- 新增功能：补充了tableFilterModule模块；

## 版本 1.0.2
### 2024-09-19
- 优化功能：优化了indicesManager代码，新增了calculateIndices功能；
- 优化功能：优化了elementObserver代码，重新梳理了整个逻辑，简化了代码；

### 2024-09-23
- 优化功能：优化enhanceUIWithContextMenu，也把其中的观察时间提取出来，放到elementObserver中；
- 优化功能：优化待优化tooltipObserver，更改了整个页面观察的逻辑；

### 2024-09-24
- 优化功能：优化点击调舱的时候，面板也会触发elementObserver,增加判断条件排除掉；
- 优化功能：修复enhanceUIWithContextMenu中的bug，讲判断条件放到addCustomContextMenu中；
- 优化功能：修复了processPriceDiffData中targetFlight参数的bug；
- 新增功能：新增了CN航班价差信息。

## 版本 1.0.3
### 2024-09-27
- 优化功能：优化longInstruction的名称；

### 2024-09-29
- 优化功能：优化enhanceUIWithContextMenu的逻辑，新增了state中的excludeFlightInfo，替换currentFlightInfo；
- 优化功能：优化enhanceUIWithContextMenu的逻辑，增加了调整页面没有航班信息时候的return；
- 优化功能：优化enhanceUIWithContextMenu的逻辑，将航司的判断放到了click里边；
- 优化功能：优化enhanceUIWithContextMenu的逻辑，修复了原本代码中left与right错误的问题；


*/

(function() {
    'use strict';

    // 模块系统
    const ModuleSystem = (function() {
        const modules = {};
        const definitions = {};

        function require(name) {
            if (!modules[name]) {
                if (definitions[name]) {
                    modules[name] = {
                        instance: definitions[name].factory.apply(null, definitions[name].dependencies.map(require))
                    };
                } else {
                    throw new Error('Module ' + name + ' not found!');
                }
            }
            return modules[name].instance;
        }

        return {
            define: function(name, dependencies, factory) {
                if (definitions[name]) {
                    console.warn('Module ' + name + ' has already been defined');
                    return;
                }
                definitions[name] = { dependencies, factory };
            },
            get: function(name) {
                return require(name);
            }
        };
    })();

    // 模块系统
    ModuleSystem.define('core', [], function() {
        const $ = (Selector, el) => (el || document).querySelector(Selector);
        const $$ = (Selector, el) => (el || document).querySelectorAll(Selector);
        return {
            $: $,
            $$: $$,
            gv: function(key, defaultValue) {
                return GM_getValue(key, defaultValue);
            },
            sv: function(key, value) {
                GM_setValue(key, value);
            },
            isFeatureEnabled: function(featureKey) {
                return this.gv(featureKey, true) === true;
            },
            debounce: function debounce(func, wait) {
                let timeout;
                return function(...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), wait);
                };
            },
            throttle:function throttle(func, limit) {
                var inThrottle;
                return function executedFunction() {
                    var context = this;
                    var args = arguments;
                    if (!inThrottle) {
                        func.apply(context, args);
                        inThrottle = true;
                        setTimeout(function() {
                            inThrottle = false;
                        }, limit);
                    }
                };
            },

            delay:function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            },

        };
    });

    ModuleSystem.define('config', [], function() {
        return {
            // URL配置
            urls: {
                modelList: 'http://sfm.hnair.net/sfm-admin/priceCheck/exclude/modelList',
                leaderList: 'http://sfm.hnair.net/sfm-admin/priceCheck/exclude/leaderList',
                currentList: 'http://sfm.hnair.net/sfm-admin/sys/sysfltseguser/listCurrent',
                longCmdFltno: 'http://sfm.hnair.net/sfm-admin/rtquery/longcmd/fltno',
                longCmdQuery: 'http://sfm.hnair.net/sfm-admin/rtquery/longcmd/query',
                flightControlList: 'http://sfm.hnair.net/sfm-admin/fltmanage/flightcontrol/list',
                priceCheckRuleList: 'http://sfm.hnair.net/sfm-admin/priceCheck/rule/list',
                autoImLogList: 'http://sfm.hnair.net/sfm-admin/im/autoimlog/list'
            },

            // 选择器配置
            selectors: {
                refreshButton: '#refresh',
                dateInputStart: 'input[placeholder="开始日期"]',
                dateInputEnd: 'input[placeholder="结束日期"]',
                segInput: 'input#seg[placeholder="请填写"]',
                fltNosInput: '#fltNos .ant-select-selection-search-input',
                queryButton: 'button.ant-btn.ant-btn-primary',
                cabinControlId: '#cabin-control-id .ant-table-tbody',
                artTable: '.art-table',
                logoCommon: '.logo-common___1uHpY.logo-small___yPRwa'
            },

            // DOM元素ID配置
            elementIds: {
                kcg: 'kcg',
                selectUser: 'select_user',
                selectContainer: 'select_container',
                batchQueryButton: 'batchQueryButton',
                basicApplyReason: 'basic_applyReason',
                basicFlowInstanceName: 'basic_flowInstanceName',
                basicRemark: 'basic_remark',
                fltDate: 'fltDate',
                route: 'route',
                airline: 'airline',
                module: 'module',
                jobName: 'jobName',
                seg: 'seg',
                applicableCabin: 'applicableCabin',
                fltNo: 'fltNo',
                startDcp: 'startDcp',
                endDcp: 'endDcp',
                approveLead: 'approveLead',
                reason: 'reason'
            },

            // 类名配置
            classNames: {
                kmenu: 'kmenu',
                checkbutton: 'checkbutton',
                checked: 'checked',
                batchAddButton: 'batch-add-button'
            },

            ELEMENT_TYPES: {
                DATE_FLIGHT: 'dateFlight',
                ECONOMIC_PRICE: 'economicPrice',
                BUSINESS_PRICE: 'businessPrice',
                OTHER: 'other'
            },

            // 菜单项配置
            menuItems: [
                {
                    id: 'adjustInterval',
                    text: '调整间隔',
                    hasCheckbox: false,
                    storageKey: 'k_interval',
                    defaultValue: 50
                },
                {
                    id: 'priceDisplay',
                    text: '价差显示',
                    hasCheckbox: true,
                    storageKey: 'k_priceDisplay',
                    defaultValue: true
                },
                {
                    id: 'syncDisplay',
                    text: '同期数据显示',
                    hasCheckbox: true,
                    storageKey: 'k_syncDisplay',
                    defaultValue: true
                },
                {
                    id: 'bulkCabinChange',
                    text: '批量调舱',
                    hasCheckbox: true,
                    storageKey: 'k_bulkCabinChange',
                    defaultValue: true
                },
                {
                    id: 'batchAVJLong',
                    text: '批量AVJ长指令',
                    hasCheckbox: true,
                    storageKey: 'k_batchavjlong',
                    defaultValue: true
                },
                {
                    id: 'quickNavigation',
                    text: '快捷跳转',
                    hasCheckbox: true,
                    storageKey: 'k_quickNavigation',
                    defaultValue: true
                },
                {
                    id: 'interfaceOptimization',
                    text: '界面优化',
                    hasCheckbox: true,
                    storageKey: 'k_interfaceOptimization',
                    defaultValue: true
                },
                {
                    id: 'checkUpdate',
                    text: '检查更新',
                    hasCheckbox: false
                },
                {
                    id: 'about',
                    text: '关于',
                    hasCheckbox: false
                }
            ],

            // 存储键配置
            storageKeys: {
                userInfo: 'userInfo',
                menuData: 'menuData',
                leaderData: 'leaderData',
                fltNosData: 'fltNosData',
                fltNosResults: 'fltNosResults',
                filteredFlightList: 'filteredFlightList',
                currentFlightInfo: 'currentFlightInfo',
                currentModule: 'currentModule',
                currentJob: 'currentJob',
                cabinPricePolicyStorage: 'cabinPricePolicyStorage'
            },

            // 默认值配置
            defaults: {
                interval: 50,
                allSeg: 'ALLSEG'
            },

            // 时间配置
            timings: {
                requestTimeout: 300000, // 5分钟
                mutationObserverDebounce: 1000,
                formFillingDelay: {
                    initial: 1000,
                    afterClick: 400,
                    beforeConfirm: 200,
                    finalConfirm: 100
                }
            },

            // 自定义事件名称
            customEvents: {
                input: 'input',
                change: 'change',
                click: 'click',
                mouseenter: 'mouseenter',
                mouseover: 'mouseover',
                mousemove: 'mousemove'
            },

            // 其他配置
            misc: {
                cabinTypes: {
                    economic: '经济舱',
                    business: '公务舱'
                },
                defaultReason: '为了确保航班正常销售，特此申请暂时剔除自动化调整规则，以便根据实时市场情况灵活调整。',
                cityCodeMap: {
                    'PEK': 'BJS', 'PKX': 'BJS', 'TFU': 'CTU', 'XIY': 'SIA', 'PVG':'SHA'
                },
                maxRetries: 5,
                retryDelay: 600,
                weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
            },

            virtualScroll: {
                itemHeight: 30, // 每个列表项的高度（像素）
                overscan: 5, // 额外渲染的项目数量
                containerHeight: 300 // 容器高度（像素）
            },
        };
    });

    ModuleSystem.define('utils', ['config'], function(config) {

        function virtualScroll(containerElement, items, renderItem) {

            const { itemHeight, overscan, containerHeight } = config.virtualScroll;
            const totalHeight = items.length * itemHeight;
            let scrollTop = 0;

            containerElement.style.height = `${containerHeight}px`;
            containerElement.style.overflowY = 'auto';

            const content = document.createElement('div');
            content.style.height = `${totalHeight}px`;
            content.style.position = 'relative';
            containerElement.appendChild(content);

            function render() {
                const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
                const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

                content.innerHTML = '';
                for (let i = startIndex; i <= endIndex; i++) {
                    const itemElement = renderItem(items[i]);
                    itemElement.style.position = 'absolute';
                    itemElement.style.top = `${i * itemHeight}px`;
                    itemElement.style.height = `${itemHeight}px`;
                    content.appendChild(itemElement);
                }
            }

            const handleScroll = this.throttle(function() {
                scrollTop = containerElement.scrollTop;
                render();
            }, 16); // 约60fps

            containerElement.addEventListener('scroll', handleScroll);

            render(); // 初始渲染

            return {
                update: function(newItems) {
                    items = newItems;
                    content.style.height = `${items.length * itemHeight}px`;
                    render();
                }
            };
        }

        return {
            virtualScroll: virtualScroll,
        };
    });

    ModuleSystem.define('state', ['core'], function(core) {
        // 私有变量
        let _cachedUserInfo = null;
        let _globalIndices = null;
        let _currentElementType = null;
        let _currentFlightInfo = null;
        let _excludeFlightInfo = null;
        let _priceList = null;
        let _currentMenuId = null;
        const _requestCache = new Map();

        // 用于存储初始值的对象
        let _initialValues = {
            firstCell: '',
            secondCell: '',
            tabPane: ''
        };

        let state = {
            // 1. 从 sessionStorage 获取的不变数据
            get userInfo() {
                if (_cachedUserInfo === null) {
                    const data = localStorage.getItem('userInfo');
                    _cachedUserInfo = data ? JSON.parse(data) : {};
                }
                return _cachedUserInfo;
            },

            // 2. 需要在特定页面初始化的数据
            get globalIndices() {
                return _globalIndices;
            },
            set globalIndices(indices) {
                _globalIndices = indices;
            },

            get currentFlightInfo() {
                const storedInfo = sessionStorage.getItem('currentFlightInfo');
                return storedInfo ? JSON.parse(storedInfo) : null;
            },
            set currentFlightInfo(info) {
                if (info) {
                    sessionStorage.setItem('currentFlightInfo', JSON.stringify(info));
                } else {
                    sessionStorage.removeItem('currentFlightInfo');
                }
            },

            get currentElementType() {
                return _currentElementType;
            },
            set currentElementType(type) {
                _currentElementType = type;
            },

            get priceList() {
                return _priceList;
            },
            set priceList(list) {
                _priceList = list;
            },

            get excludeFlightInfo() {
                return _excludeFlightInfo;
            },
            set excludeFlightInfo(info) {
                _excludeFlightInfo = info;
            },

            get currentMenuId() {
                return _currentMenuId;
            },
            set currentMenuId(id) {
                _currentMenuId = id;
            },

            // 4. 临时缓存
            cacheRequest: function(key, data) {
                _requestCache.set(key, {
                    data: data,
                    timestamp: Date.now()
                });
            },
            getCachedRequest: function(key, maxAge = 300000) { // 默认5分钟过期
                const cached = _requestCache.get(key);
                if (cached && (Date.now() - cached.timestamp < maxAge)) {
                    return cached.data;
                }
                return null;
            },
            clearRequestCache: function() {
                _requestCache.clear();
            },

            // 初始值相关操作
            get initialValues() {
                return _initialValues;
            },
            set initialValues(values) {
                _initialValues = {..._initialValues, ...values};
            },

            // 重置所有状态
            resetAll: function() {
                _cachedUserInfo = null;
                _globalIndices = null;
                _currentFlightInfo = null;
                _currentElementType = null;
                _priceList = null;
                _currentMenuId = null;
                _requestCache.clear();
                _initialValues = {
                    firstCell: '',
                    secondCell: '',
                    tabPane: ''
                };
            },
        };

        return state;
    });

    ModuleSystem.define('uiOperations', ['core'], function(core) {
        return {

            fillDatePicker: function(selector, date) {
                // 实现 fillDatePicker
                return new Promise((resolve, reject) => {
                    const datePickerInput = core.$(selector).closest('.ant-picker-input');
                    if (!datePickerInput) {
                        reject(new Error(`未找到日期选择器元素: ${selector}`));
                        return;
                    }

                    const input = core.$(selector);
                    if (!input) {
                        reject(new Error('未找到日期输入框'));
                        return;
                    }

                    datePickerInput.click();

                    setTimeout(() => {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeInputValueSetter.call(input, date);

                        input.dispatchEvent(new Event('input', { bubbles: true }));

                        input.dispatchEvent(new KeyboardEvent('keydown', {
                            bubbles: true,
                            cancelable: true,
                            key: 'Enter',
                            keyCode: 13
                        }));

                        setTimeout(resolve, 100);
                    }, 300);
                });
            },
            selectDropdownOption: function(selector, optionValue) {
                // 实现 selectDropdownOption
                return new Promise((resolve, reject) => {
                    const select = core.$(selector).closest('.ant-select-selector');
                    if (!select) {
                        reject(new Error(`未找到选择框元素: ${selector}`));
                        return;
                    }

                    const mouseDownEvent = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true
                    });

                    select.dispatchEvent(mouseDownEvent);

                    setTimeout(() => {
                        const option = document.querySelector(`div.ant-select-item.ant-select-item-option[title="${optionValue}"]`);
                        if (option) {
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true
                            });

                            option.dispatchEvent(clickEvent);
                            setTimeout(resolve, 100);
                        } else {
                            reject(new Error(`未找到选项: ${optionValue}`));
                        }
                    }, 300);
                });
            },
            fillInput: function(selector, value) {
                // 实现 fillInput
                return new Promise((resolve, reject) => {
                    const input = core.$(selector);
                    if (!input) {
                        reject(new Error(`未找到元素: ${selector}`));
                        return;
                    }

                    requestAnimationFrame(() => {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeInputValueSetter.call(input, value);

                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(resolve, 100);
                    });
                });
            },
            fillTextArea: function(selector, value) {
                // 实现 fillTextArea
                return new Promise((resolve, reject) => {
                    const TextArea = core.$(selector);
                    if (!TextArea) {
                        reject(new Error(`未找到元素: ${selector}`));
                        return;
                    }

                    requestAnimationFrame(() => {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        nativeInputValueSetter.call(TextArea, value);

                        TextArea.dispatchEvent(new Event('input', { bubbles: true }));
                        TextArea.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(resolve, 100);
                    });
                });
            },
            updateTableCell: function(cell, newValue) {
                return new Promise((resolve, reject) => {
                    const editableDiv = cell.querySelector('.editable-cell-value-wrap');
                    if (!editableDiv) {
                        reject(new Error('未找到 .editable-cell-value-wrap 元素'));
                        return;
                    }

                    const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
                    editableDiv.dispatchEvent(dblClickEvent);

                    setTimeout(() => {
                        const input = cell.querySelector('input, textarea, [contenteditable="true"]')
                        if (!input) {
                            reject(new Error('未找到输入元素'));
                            return;
                        }

                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeInputValueSetter.call(input, newValue);


                        input.dispatchEvent(new Event('input', { bubbles: true }));

                        input.dispatchEvent(new Event('blur', { bubbles: true }));

                        setTimeout(resolve, 100);
                    }, 300);
                });
            },
            // 可以添加更多 UI 操作函数...
        };
    });

    ModuleSystem.define('menuManager', ['core', 'state', 'config'], function(core, state, config) {
        // 私有变量和函数
        const symbol_selector = ".logo-common___1uHpY.logo-small___yPRwa";

        // 菜单创建和管理
        function createMenu() {
            const ndivmenu = document.createElement('div');
            ndivmenu.className = "kmenu";
            ndivmenu.innerHTML = `<ul>${config.menuItems.map(createMenuItem).join('')}</ul>`;
            document.body.appendChild(ndivmenu);
            return ndivmenu;
        }

        function createMenuItem(item) {
            return `<li id="nmenuid_${item.id}">${item.text}${item.hasCheckbox ? createCheckbox() : ''}</li>`;
        }

        function createCheckbox() {
            return '<svg class="checkbutton" viewBox="0 0 100 30"><g fill="none" fill-rule="evenodd"><path fill="#E3E3E3" d="M0 15C0 6.716 6.716 0 15 0h14c8.284 0 15 6.716 15 15s-6.716 15-15 15H15C6.716 30 0 23.284 0 15z"/><circle fill="#FFF" cx="15" cy="15" r="13"/></g></svg>';
        }

        function attachMenuEvents(menu) {
            config.menuItems.forEach(item => {
                const menuItem = core.$(`#nmenuid_${item.id}`);
                menuItem.onclick = () => handleMenuItemClick(item);
            });
        }

        function handleMenuItemClick(item) {
            if (item.hasCheckbox) {
                toggleFeature(item);
            } else {
                switch(item.id) {
                    case 'adjustInterval': handleAdjustInterval(item); break;
                    case 'checkUpdate': handleCheckUpdate(); break;
                    case 'about': handleAbout(); break;
                }
            }
        }

        function toggleFeature(item) {
            const checkbox = core.$(`#nmenuid_${item.id} .checkbutton`);
            const newState = !checkbox.classList.contains('checked');
            core.sv(item.storageKey, newState);
            checkbox.classList.toggle('checked');
        }

        // 菜单项处理函数
        function handleAdjustInterval(item) {
            toggleMenu('hide');
            showDialog(item.text, "建议间隔50秒", "Go", () => {
                // 处理调整间隔逻辑
            }, "input", core.gv(item.storageKey, item.defaultValue));
        }

        function handleCheckUpdate() {
            toggleMenu('hide');
            checkForUpdates();
        }

        function handleAbout() {
            showAboutDialog();
        }

        // 工具函数
        function toggleMenu(action) {
            const menu = core.$(".kmenu");
            if (action === "show") {
                menu.style.display = 'block';
                positionMenu(menu);
            } else {
                menu.style.display = 'none';
            }
        }

        function positionMenu(menu) {
            const kcg = core.$("#kcg");
            if (kcg) {
                const rect = kcg.getBoundingClientRect();
                menu.style.left = `${rect.right + 20}px`;
                menu.style.top = `${rect.top}px`;
            }
        }

        function showDialog(title = 'HNA网络收益平台', content = '', buttonvalue = '确定', buttonfun = function(t) {return t;}, inputtype = 'br', inputvalue = '') {
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
                core.$(".ant-input", ndivalert).parentElement.style.display = 'none';
            } else if (inputtype === 'img') {
                core.$(".ant-input", ndivalert).src = inputvalue;
                core.$(".ant-input", ndivalert).style = `max-height: 19rem; height: unset; display: block; margin: 0 auto;`;
                //$(".kdialogwin", ndivalert).style = `max-width: 37.5rem;`;
            } else if (inputtype === 'textarea') {
                core.$(".ant-input", ndivalert).value = inputvalue;
                core.$(".ant-input", ndivalert).style = `max-height: 19rem; height: 10rem; display: block; margin: 0 auto; width: 100%; white-space: pre;`;
                //$(".kdialogwin", ndivalert).style = `max-width: 100%;`;
                //$(".kdialogwin .kwidth", ndivalert).style = `min-width: 28rem;`;
            }else {
                core.$(".ant-input", ndivalert).value = inputvalue;
            }
            core.$(".ant-modal-close", ndivalert).onclick = function() {
                ndivalert.remove();
            };
            core.$(".ant-btn.ant-btn-default", ndivalert).onclick = function() {
                ndivalert.remove();
            };
            core.$(".ant-btn.ant-btn-primary", ndivalert).onclick = function() {
                buttonfun(ndivalert);
                core.$(".ant-modal-close", ndivalert).onclick();
            };
            document.body.appendChild(ndivalert);

        };

        function showAboutDialog() {
            const aboutContent = `
            <div class="about-content">
                <p><strong>应用名称：</strong>网络收益平台功能扩展及易用性提升系统</p>
                <p><strong>版本：</strong>${GM_info.script.version}</p>
                <p><strong>描述：</strong>这是一款提高海航白屏系统拓展能力和效率的插件，后续会不断添加新功能。</p>
                <p><strong>用户手册：</strong><a href="${GM_info.script.supportURL}" target="_blank" class="link">点击查看用户手册</a></p>
                <p><strong>版权：</strong>© 2024 天津航空信息技术部</p>
                <p><strong>联系方式：</strong><a href='mailto:q-fu@tianjin-air.com' class="link">q-fu@tianjin-air.com</a></p>
            </div>
        `;

            showDialog('关于', aboutContent, '关闭');
        }

        const verInt = function(vs) {
            const vl = vs.split('.');
            let vi = 0;
            for (let i = 0; i < vl.length && i < 3; i++) {
                vi += parseInt(vl[i]) * (1000 ** (2 - i));
            }
            return vi;
        };

        function checkForUpdates() {
            const crv = GM_info.script.version;
            let updateURL = GM_info.scriptUpdateURL || GM_info.script.updateURL;
            let downloadURL = GM_info.script.downloadURL;
            updateURL = `${updateURL}?t=${Date.now()}`;
            downloadURL = `${downloadURL}?t=${Date.now()}`;
            GM_xmlhttpRequest({
                method: "GET",
                url: updateURL,
                onload: function(response) {
                    const m = response.responseText.match(/@version\s+(\S+)/);
                    const ltv = m && m[1];
                    if (ltv && verInt(ltv) > verInt(crv)) {
                        showDialog(`${("检查更新")}`, `${("当前版本")}: ${crv}, ${("发现最新版")}: ${ltv}`, `UPDATE`, function(t) {
                            window.open(downloadURL, '_blank');
                        });
                    } else {
                        showDialog(`${("检查更新")}`, `${("当前版本")}: ${crv}, ${("已是最新版")}`, `OK`);
                    }
                }
            });
        };

        function addStyles() {
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

    .about-content {
        font-size: 14px;
        line-height: 1.5;
        color: #333;
    }
    .about-content p {
        margin-bottom: 10px;
    }
    .about-content .link {
        color: #FF4D4F;
        text-decoration: none;
    }
    .about-content .link:hover {
        text-decoration: underline;
    }

    `);
        };

        // 初始化函数
        function init() {
            if (!core.$(symbol_selector) || core.$("#kcg")) return;

            const logoElement = core.$(symbol_selector);
            logoElement.id = "kcg";

            addStyles();

            const menu = createMenu();
            attachMenuEvents(menu);
            setUserOptions();


            logoElement.onmouseover = menu.onmouseover = () => toggleMenu('show');
            logoElement.onmouseleave = menu.onmouseleave = () => toggleMenu('hide');
            logoElement.onclick = () => toggleMenu(menu.style.display === 'none' ? 'show' : 'hide');
        }

        function setUserOptions() {
            config.menuItems.forEach(item => {
                if (item.hasCheckbox && core.gv(item.storageKey, item.defaultValue)) {
                    core.$(`#nmenuid_${item.id} .checkbutton`).classList.add('checked');
                }
            });
        }

        // 公共接口
        return {
            init: init,
        };
    });

    ModuleSystem.define('indicesManager', ['core', 'state'], function(core, state) {
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 600; // 600ms

        function getIndices() {
            const headerRow = document.querySelector('.art-table .art-table-header');
            if (!headerRow) return null;

            const headerCells = headerRow.querySelectorAll('.art-table-header-cell');
            let dateFlightIndex = -1;
            let economicPriceIndex = -1;
            let businessPriceIndex = -1;

            headerCells.forEach((cell, index) => {
                const cellText = cell.textContent.trim();
                if (cellText.includes('航班号')) {
                    dateFlightIndex = index;
                } else if (cellText.includes('最低经济舱价格')) {
                    economicPriceIndex = index;
                } else if (cellText.includes('最低公务舱价格')) {
                    businessPriceIndex = index;
                }
            });

            return {
                dateFlightIndex_origin: dateFlightIndex,
                economicPriceIndex_origin: economicPriceIndex,
                businessPriceIndex_origin: businessPriceIndex
            };
        }

        function areIndicesValid(indices) {
            return indices &&
                indices.dateFlightIndex_origin !== -1 &&
                indices.economicPriceIndex_origin !== -1 &&
                indices.businessPriceIndex_origin !== -1;
        }

        const debouncedGetIndicesWithRetry = core.debounce((retryCount = 0) => {
            const indices = getIndices();
            if (areIndicesValid(indices)) {
                state.globalIndices = indices;
                console.log('Updated globalIndices:', indices);
                if (observer) {
                    observer.disconnect(); // 成功获取索引后断开观察
                }
            } else if (retryCount < MAX_RETRIES) {
                console.log(`Retrying to get indices... (${retryCount + 1}/${MAX_RETRIES})`);
                setTimeout(() => debouncedGetIndicesWithRetry(retryCount + 1), RETRY_DELAY);
            } else {
                console.error('Failed to get valid indices after maximum retries');
                if (observer) {
                    observer.disconnect(); // 达到最大重试次数后断开观察
                }
            }
        }, 300);

        let observer = null;

        function initObserver() {
            observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.type === 'childList') {
                        const refreshElement = core.$('#refresh');
                        if (refreshElement) {
                            debouncedGetIndicesWithRetry();
                            break;
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        // 提取共用的索引计算逻辑
        const calculateIndices = function(isFirstCellSpecial) {
            const { dateFlightIndex_origin, economicPriceIndex_origin, businessPriceIndex_origin } = state.globalIndices;
            return {
                dateFlightIndex: isFirstCellSpecial ? dateFlightIndex_origin : dateFlightIndex_origin - 1,
                economicPriceIndex: isFirstCellSpecial ? economicPriceIndex_origin : economicPriceIndex_origin - 1,
                businessPriceIndex: isFirstCellSpecial ? businessPriceIndex_origin : businessPriceIndex_origin - 1
            };
        }

        return {
            init: function() {
                initObserver();
            },
            calculateIndices: calculateIndices,
        };
    });

    ModuleSystem.define('apiHookManager', ['core', 'state'], function(core, state) {

        function HookXMLHttpRequest() {

            function shouldInterceptLongInstructionRequest(url, method) {
                return url && typeof url === 'string' && url.includes('sfm-admin/rtquery/longcmd/query') && method === 'POST' && core.isFeatureEnabled("k_batchavjlong");
            }

            function shouldInterceptFlightControlRequest(url, method) {
                return url && typeof url === 'string' && url.includes('sfm-admin/fltmanage/flightcontrol/list') && method === 'GET' && core.isFeatureEnabled("k_quickNavigation");
            }

            async function makeCustomFetch(details) {
                const userInfo = state.userInfo;
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

            async function handleLongInstructionRequest(xhr, data) {
                const requestBody = JSON.parse(data);
                if (requestBody.seg === "ALLSEG") {
                    console.log('特殊处理多段请求...');

                    const selectElement = core.$('#select_user');
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

            async function handleFlightControlRequest(xhr) {
                console.log('拦截到航班控制列表请求');

                return new Promise((resolve) => {
                    const originalOnLoad = xhr.onload;
                    xhr.onload = function() {
                        if (this.status === 200) {
                            const response = JSON.parse(this.responseText);
                            if (response && response.obj && Array.isArray(response.obj.list)) {
                                const userInfo = state.userInfo;
                                const { airCompony } = userInfo;

                                //const filteredList = response.obj.list.filter(flight => {
                                //    if (airCompony === "HU") {
                                //        return flight.fltNo.includes("HU") || flight.fltNo.includes("CN");
                                //    } else {
                                //        return flight.fltNo.includes(airCompony);
                                //    }
                                //});

                                const filteredList = response.obj.list.map(flight => ({
                                    airRoute: flight.airRoute,
                                    airline: flight.airline,
                                    origin: flight.origin,
                                    dest: flight.dest,
                                    fltDate: flight.fltDate,
                                    fltNo: flight.fltNo,
                                    seg: flight.seg
                                }));

                                // 获取现有的累积列表
                                let accumulatedFlightList = JSON.parse(sessionStorage.getItem('filteredFlightList') || '[]');

                                // 将新的过滤后的航班添加到累积列表中
                                accumulatedFlightList = accumulatedFlightList.concat(filteredList);

                                // 存储筛选后的数据到 sessionStorage
                                sessionStorage.setItem('filteredFlightList', JSON.stringify(accumulatedFlightList));
                                console.log('已将筛选后的航班数据存储到 sessionStorage');
                            }
                        }
                        if (originalOnLoad) {
                            originalOnLoad.apply(this, arguments);
                        }
                        resolve();
                    };
                });
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
                        if (shouldInterceptLongInstructionRequest(this._url, this._method)) {
                            const requestBody = JSON.parse(data);
                            if (requestBody.seg === "ALLSEG") {
                                try {
                                    const handled = await handleLongInstructionRequest(this, data);
                                    if (handled) {
                                        return;
                                    }
                                } catch (error) {
                                    console.error('处理长指令请求时出错:', error);
                                }
                            }
                        } else if (shouldInterceptFlightControlRequest(this._url, this._method)) {
                            const originalOnReadyStateChange = this.onreadystatechange;
                            this.onreadystatechange = async function() {
                                if (this.readyState === 4) {
                                    await handleFlightControlRequest(this);
                                }
                                if (originalOnReadyStateChange) {
                                    originalOnReadyStateChange.apply(this, arguments);
                                }
                            };
                        }
                        return originalSend.apply(this, arguments);
                    };

                    return xhr;
                }
            });

            unsafeWindow.XMLHttpRequest = XHRProxy;
        }

        return {
            init: function() {
                HookXMLHttpRequest();
            }
        };
    });

    ModuleSystem.define('enhanceUI', ['core'], function(core) {

        if (!core.isFeatureEnabled("k_interfaceOptimization")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        function moveButton() {
            const refreshButton = core.$('#refresh');
            const container = core.$('.ant-col-9 .ant-row.ant-form-item-row .ant-form-item-control-input .ant-space');
            if (refreshButton && container && refreshButton.parentNode !== container) {
                container.appendChild(refreshButton);
            }
        }

        function removeButton() {
            const buttons = core.$$('button.ant-btn.ant-btn-default');
            buttons.forEach(button => {
                if (button.className === 'ant-btn ant-btn-default' && button.textContent.trim() === '重 置') {
                    button.remove();
                }
            });
        }

        return {
            init: function() {
                moveButton();
                removeButton();
            }
        };
    });

    ModuleSystem.define('enhanceUIWithContextMenu', ['core', 'state', 'indicesManager'], function(core, state, indicesManager) {

        if (!core.isFeatureEnabled("k_interfaceOptimization")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        function addCustomContextMenu() {

            const refreshElement = core.$('#refresh');
            const leftTargetElement = core.$('.art-table');
            const rightTargetElement = core.$('#cabin-control-id');


            if ( refreshElement && leftTargetElement && !leftTargetElement.dataset.customMenuAdded && !leftTargetElement.querySelector('.ant-empty-description')) {
                setupContextMenu(leftTargetElement, 'left');
            }

            if (rightTargetElement && !rightTargetElement.dataset.customMenuAdded) {
                setupContextMenu(rightTargetElement, 'right');
            }
        }

        function setupContextMenu(element, side) {
            element.dataset.customMenuAdded = 'true';

            element.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                removeAllCustomMenus();

                const menuId = `${side}-menu-${Date.now()}`;
                state.currentMenuId = menuId;
                const menu = createContextMenu(event.pageX, event.pageY, menuId, side);
                document.body.appendChild(menu);
            });
        }

        function createContextMenu(x, y, menuId, side) {

            const menu = document.createElement('div');
            menu.className = 'custom-context-menu';
            menu.id = menuId;
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;

            if (side === 'right') {
                addRightMenuItems(menu);
            } else {
                addLeftMenuItems(menu);
            }

            return menu;
        }

        function addContextMenuStyles() {
            GM_addStyle(`
        .custom-context-menu, .custom-context-submenu {
            font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
            font-size: 13px;
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            overflow: visible;
            box-sizing: border-box;
            min-width: 140px;
            position: absolute;
            z-index: 10000;
            cursor: default;
            padding: 4px 0;
            display: none;
        }
        .custom-context-menu {
            display: block;
        }
        .custom-context-submenu {
            left: 100%;
            top: -4px;
        }
        .custom-context-menu-item {
            padding: 6px 16px 6px 24px;
            cursor: pointer;
            color: #333333;
            text-align: left;
            position: relative;
            display: flex;
            align-items: center;
            white-space: nowrap;
        }
        .custom-context-menu-item:hover {
            background-color: #f0f0f0;
        }
        .custom-context-menu-item.has-submenu::after {
            content: '▶';
            position: absolute;
            right: 8px;
            font-size: 9px;
            color: #999;
        }
    `);
        }

        function addRightMenuItems(menu) {
            const sendItem = createMenuItem('发送指令');
            sendItem.addEventListener('click', () => {
                const button = Array.from(core.$$('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发送指令'));
                if (button) {
                    button.click();
                }
                removeAllCustomMenus();
            });

            const priceAdjustmentItem = createMenuItem('发起调价');
            priceAdjustmentItem.addEventListener('click', () => {
                const button = Array.from(core.$$('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发起调价'));
                if (button) {
                    button.click();
                }
                removeAllCustomMenus();
            });

            menu.appendChild(sendItem);
            menu.appendChild(priceAdjustmentItem);
        }

        function addLeftMenuItems(menu) {
            const excludeFlightItem = createMenuItem('排除航班', true);
            const moduleSubMenu = createSubmenu();
            excludeFlightItem.appendChild(moduleSubMenu);

            const menuData = JSON.parse(sessionStorage.getItem('menuData') || 'null');
            const currentFlightInfo = state.currentFlightInfo

            // 检查当前航班信息是否存在
            if (!currentFlightInfo || !currentFlightInfo.flightNumber) {
                //console.log('No current flight info available');
                return;
            }

            if (menuData) {
                menuData.forEach(moduleData => {
                    const moduleItem = createMenuItem(moduleData.module, true);
                    const jobSubMenu = createSubmenu();

                    moduleData.jobList.forEach(job => {
                        const jobItem = createMenuItem(job);
                        jobItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            console.log(`排除航班 - ${moduleData.module} - ${job}`);

                            const targetAirCompany = currentFlightInfo.flightNumber.substring(0, 2);
                            const userInfo = state.userInfo;
                            const { airCompony } = userInfo;

                            // 检查航空公司是否匹配
                            if ((targetAirCompany === airCompony) || (airCompony === "HU" && targetAirCompany === "CN")) {
                                simulateClick('排除航班');
                                sessionStorage.setItem('excludeFlightInfo', JSON.stringify(currentFlightInfo));
                                sessionStorage.setItem('currentModule', JSON.stringify(moduleData.module));
                                sessionStorage.setItem('currentJob', JSON.stringify(job));
                            }
                            removeAllCustomMenus();

                        });
                        jobSubMenu.appendChild(jobItem);
                    });

                    moduleItem.appendChild(jobSubMenu);
                    moduleSubMenu.appendChild(moduleItem);
                });
            }

            menu.appendChild(excludeFlightItem);
            setupSubmenus(menu);
        }

        function createMenuItem(text, hasSubmenu = false) {
            const item = document.createElement('div');
            item.className = `custom-context-menu-item${hasSubmenu ? ' has-submenu' : ''}`;
            item.textContent = text;
            return item;
        }

        function createSubmenu() {
            const submenu = document.createElement('div');
            submenu.className = 'custom-context-submenu';
            return submenu;
        }

        function setupSubmenus(menu) {
            const items = menu.querySelectorAll('.custom-context-menu-item.has-submenu');
            items.forEach(item => {
                const submenu = item.querySelector('.custom-context-submenu');
                if (submenu) {
                    setupMouseEvents(item, submenu);
                }
            });
        }

        function setupMouseEvents(item, submenu) {
            let timeout;
            item.addEventListener('mouseover', () => {
                clearTimeout(timeout);
                Array.from(item.parentNode.children).forEach(child => {
                    if (child !== item && child.querySelector('.custom-context-submenu')) {
                        hideSubmenu(child.querySelector('.custom-context-submenu'));
                    }
                });
                showSubmenu(submenu);
            });
            item.addEventListener('mouseout', (e) => {
                if (!submenu.contains(e.relatedTarget)) {
                    timeout = setTimeout(() => hideSubmenu(submenu), 300);
                }
            });
            submenu.addEventListener('mouseover', () => clearTimeout(timeout));
            submenu.addEventListener('mouseout', (e) => {
                if (!item.contains(e.relatedTarget)) {
                    timeout = setTimeout(() => hideSubmenu(submenu), 300);
                }
            });
        }

        function showSubmenu(submenu) {
            submenu.style.display = 'block';
        }

        function hideSubmenu(submenu) {
            submenu.style.display = 'none';
        }

        function removeAllCustomMenus() {
            const menus = document.querySelectorAll('.custom-context-menu');
            menus.forEach(menu => menu.remove());
            state.currentMenuId = null;
        }

        function simulateClick(item) {
            const topDocument = window.top.document;
            const moduleMenu = topDocument.querySelector(`div[data-menu-id="menu-id-/PriceDiff"]`);
            if (moduleMenu) {
                simulateHover(moduleMenu);

                setTimeout(() => {
                    const jobItem = topDocument.querySelector(`li[data-menu-id="menu-id-/PriceDiff/ExcludeFlight"]`);
                    if (jobItem) {
                        jobItem.click();
                    } else {
                        console.log(`排除航班选项未找到`);
                    }
                }, 200);
            } else {
                console.log(`价差菜单未找到`);
            }
        }

        function simulateHover(element) {
            const events = ['mouseenter', 'mouseover', 'mousemove'];
            events.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    view: window.top,
                    bubbles: true,
                    cancelable: true,
                    clientX: element.getBoundingClientRect().left,
                    clientY: element.getBoundingClientRect().top
                });
                element.dispatchEvent(event);
            });
        }

        return {
            init: function() {

                addContextMenuStyles(); // 添加这一行
                addCustomContextMenu();

                // 添加全局点击事件监听器
                document.addEventListener('click', (e) => {
                    if (state.currentMenuId) {
                        const currentMenu = document.getElementById(state.currentMenuId);
                        if (currentMenu && !currentMenu.contains(e.target)) {
                            removeAllCustomMenus();
                        }
                    }
                });
            }
        };
    });

    ModuleSystem.define('dataEventManager', ['core', 'state'], function(core, state) {

        if (!core.isFeatureEnabled("k_priceDisplay") && !core.isFeatureEnabled("k_syncDisplay") && !core.isFeatureEnabled("k_quickNavigation")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        // 事件管理模块
        const eventManager = {
            init: function(mutations) {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.id === 'refresh' || node.querySelector('#refresh')) {
                                    this.addEventListeners();
                                }
                            }
                        });
                    }
                });
            },

            addEventListeners: function() {
                const refreshButton = core.$('#refresh');
                const form = core.$('form.ant-form.ant-form-inline.ant-form-middle.plane-adapt-form');

                if (refreshButton && !refreshButton.hasAttribute('data-listener-added')) {
                    refreshButton.addEventListener('click', eventTrigger.handleEvent);
                    refreshButton.setAttribute('data-listener-added', 'true');
                }

                if (form) {
                    if (!form.hasAttribute('data-submit-listener-added')) {
                        form.addEventListener('submit', eventTrigger.handleEvent);
                        form.setAttribute('data-submit-listener-added', 'true');
                    }

                    if (!form.hasAttribute('data-keydown-listener-added')) {
                        form.addEventListener('keydown', eventTrigger.handleEvent);
                        form.setAttribute('data-keydown-listener-added', 'true');
                    }
                }
            }
        };

        // 事件触发模块
        const eventTrigger = {
            handleEvent: function(event) {
                // 防止表单默认提交行为
                if (event.type === 'submit') {
                    event.preventDefault();
                }

                // 只在按下Enter键时触发
                if (event.type === 'keydown' && event.key !== 'Enter') {
                    return;
                }

                console.log(`触发了${event.type}事件`);
                eventTrigger.triggerDataFetch();
            },

            triggerDataFetch: function() {
                if (core.isFeatureEnabled("k_quickNavigation")) {
                    dataFetcher.getMenuData();
                    dataFetcher.getLeaderList();
                    dataStorage.clearFilteredFlightList();
                }
                if (core.isFeatureEnabled("k_priceDisplay")) {
                    dataFetcher.fetchPriceDifferenceData();
                    state.currentElementType = null;
                    state.PriceList = null;
                    state.currentFlightInfo = null;


                }
                if (core.isFeatureEnabled("k_syncDisplay")) {
                    dataFetcher.fetchSyncDateData();
                }
            }
        };

        // 数据获取模块
        const dataFetcher = {
            getMenuData: async function() {
                try {
                    const userInfo = state.userInfo;
                    const { token: authorizationToken } = userInfo;

                    const response = await fetch("http://sfm.hnair.net/sfm-admin/priceCheck/exclude/modelList", {
                        "headers": {
                            "accept": "application/json, text/plain, */*",
                            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                            "request-starttime": Date.now().toString(),
                            "x-authorization": authorizationToken
                        },
                        "referrer": "http://sfm.hnair.net/?onlyContent=1&t=0.8830882693673767",
                        "referrerPolicy": "strict-origin-when-cross-origin",
                        "body": null,
                        "method": "GET",
                        "mode": "cors",
                        "credentials": "include"
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const menuData = await response.json();
                    dataStorage.saveMenuData(menuData.obj);
                } catch (error) {
                    console.error('Error fetching menu data:', error);
                }
            },

            getLeaderList: async function() {
                try {
                    const userInfo = state.userInfo;
                    const { token: authorizationToken } = userInfo;

                    const response = await fetch("http://sfm.hnair.net/sfm-admin/priceCheck/exclude/leaderList", {
                        "headers": {
                            "accept": "application/json, text/plain, */*",
                            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                            "request-starttime": Date.now().toString(),
                            "x-authorization": authorizationToken
                        },
                        "referrer": "http://sfm.hnair.net/?onlyContent=1&t=0.7775500487471136",
                        "referrerPolicy": "strict-origin-when-cross-origin",
                        "body": null,
                        "method": "GET",
                        "mode": "cors",
                        "credentials": "include"
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const leaderData = await response.json();
                    dataStorage.saveLeaderData(leaderData.obj);
                } catch (error) {
                    console.error('Error fetching leader list:', error);
                }
            },

            fetchPaginatedData: async function(url, headers) {
                const REQUEST_TIMEOUT = 300000; // 5 minutes timeout

                async function GM_xmlhttpRequestAsync(options) {
                    const cacheKey = JSON.stringify(options);
                    const cached = state.getCachedRequest(cacheKey, REQUEST_TIMEOUT);
                    if (cached) {
                        return cached;
                    }
                    const response = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            ...options,
                            onload: resolve,
                            onerror: reject
                        });
                    });
                    const data = JSON.parse(response.responseText);
                    state.cacheRequest(cacheKey, data);
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
            },

            fetchPriceDifferenceData: async function() {
                try {
                    const userInfo = state.userInfo;
                    const { token: authorizationToken, airCompony } = userInfo;
                    const xsrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '';

                    const cityCodeText = this.getCityCodeText();
                    if (!cityCodeText) return;

                    const depCityCode = cityCodeText.substring(0, 3).toUpperCase();
                    const arrCityCode = cityCodeText.substring(3, 6).toUpperCase();

                    const startFltDate = core.$('input[placeholder="开始日期"]').value;
                    const endFltDate = core.$('input[placeholder="结束日期"]').value;

                    let allData = [];

                    if (airCompony === 'HU') {
                        // 获取 HU 的数据
                        const huData = await this.fetchAllData(depCityCode, arrCityCode, startFltDate, endFltDate, 'HU', authorizationToken, xsrfToken);
                        // 获取 CN 的数据
                        const cnData = await this.fetchAllData(depCityCode, arrCityCode, startFltDate, endFltDate, 'CN', authorizationToken, xsrfToken);
                        // 合并数据
                        allData = [...huData, ...cnData];
                    } else {
                        // 对于其他航空公司，只获取其自身的数据
                        allData = await this.fetchAllData(depCityCode, arrCityCode, startFltDate, endFltDate, airCompony, authorizationToken, xsrfToken);
                    }

                    state.globalFetchedData = allData;
                    console.log('已经获取了新的价差数据', allData);
                } catch (error) {
                    console.error('发生错误：', error);
                }
            },

            fetchAllData: async function(depCityCode, arrCityCode, startFltDate, endFltDate, airline, authorizationToken, xsrfToken) {
                function standardizeCityCode(code) {
                    const cityMap = {
                        'PEK': 'BJS', 'PKX': 'BJS', 'TFU': 'CTU', 'XIY': 'SIA', 'PVG':'SHA'
                    };
                    return cityMap[code.toUpperCase()] || code.toUpperCase();
                }

                depCityCode = standardizeCityCode(depCityCode);
                arrCityCode = standardizeCityCode(arrCityCode);
                const url = `http://sfm.hnair.net/sfm-admin/priceCheck/rule/list?limit=50&depCityCode=${depCityCode}&arrCityCode=${arrCityCode}&airline=${airline}&fltStartDate=${startFltDate}&fltEndDate=${endFltDate}`;
                const headers = {
                    'Accept': 'application/json, text/plain, */*',
                    'X-Authorization': authorizationToken,
                    'X-Xsrf-Token': xsrfToken
                };
                return this.fetchPaginatedData(url, headers);
            },

            fetchSyncDateData: async function() {
                try {
                    const userInfo = state.userInfo;
                    const { token: authorizationToken } = userInfo;

                    const cityCodeText = this.getCityCodeText();
                    if (!cityCodeText) return;

                    const depCityCode = cityCodeText.substring(0, 3).toUpperCase();
                    const arrCityCode = cityCodeText.substring(3, 6).toUpperCase();

                    const startFltDate = core.$('input[placeholder="开始日期"]').value;
                    const endFltDate = core.$('input[placeholder="结束日期"]').value;

                    const params = this.setCommandTimes();

                    const url = `http://sfm.hnair.net/sfm-admin/im/autoimlog/list?limit=${params.limit}&jobId=${params.jobId}&origin=${encodeURIComponent(depCityCode)}&dest=${encodeURIComponent(arrCityCode)}&status=${encodeURIComponent(params.status)}&dataSource=${encodeURIComponent(params.dataSource)}&startFltDate=${encodeURIComponent(startFltDate)}&endFltDate=${encodeURIComponent(endFltDate)}&startCmdTime=${encodeURIComponent(params.startCmdTime)}&endCmdTime=${encodeURIComponent(params.endCmdTime)}&isCmd=${encodeURIComponent(params.isCmd)}&jobWarningType=${encodeURIComponent(params.jobWarningType)}`;
                    const headers = {
                        'Accept': 'application/json, text/plain, */*',
                        'X-Authorization': authorizationToken
                    };

                    const additionalData = await this.fetchPaginatedData(url, headers);
                    state.globalAdditionalData = additionalData;
                    console.log('已经获取了历史航线平均价格数据:', additionalData);
                } catch (error) {
                    console.error('发生错误：', error);
                }
            },

            getCityCodeText: function() {
                const label = core.$('label[title="航段"]');
                if (label) {
                    const parent = label.parentElement;
                    const siblings = Array.from(parent.parentNode.children).filter(child => child !== parent);
                    const firstElement = siblings.find(sibling => sibling.querySelector('.ant-select-selection-item'));
                    return firstElement ? firstElement.textContent : core.$("#basic_segs")?.value || core.$('input[id*="segs"]')?.value;
                }
                return '';
            },

            setCommandTimes: function() {
                function formatMonth(month) {
                    return month < 9 ? `0${month + 1}` : `${month + 1}`;
                }

                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const dayOfMonth = today.getDate();

                let startCmdTime, endCmdTime;

                if (dayOfMonth === 1) {
                    const lastMonth = new Date(year, month - 1, 15);
                    startCmdTime = `${lastMonth.getFullYear()}-${formatMonth(lastMonth.getMonth())}-15 00:00:00`;
                    endCmdTime = `${lastMonth.getFullYear()}-${formatMonth(lastMonth.getMonth())}-15 23:59:59`;
                } else if (dayOfMonth >= 2 && dayOfMonth <= 15) {
                    startCmdTime = `${year}-${formatMonth(month)}-01 00:00:00`;
                    endCmdTime = `${year}-${formatMonth(month)}-01 23:59:59`;
                } else {
                    startCmdTime = `${year}-${formatMonth(month)}-15 00:00:00`;
                    endCmdTime = `${year}-${formatMonth(month)}-15 23:59:59`;
                }

                return {
                    limit: 20,
                    jobId: 'job_18992',
                    status: '',
                    dataSource: 'clickHouse',
                    startCmdTime: startCmdTime,
                    endCmdTime: endCmdTime,
                    isCmd: '',
                    jobWarningType: ''
                };
            },

            fetchUserList: async function(startFltDate, endFltDate) {
                const userInfo = state.userInfo;
                const { token: authorizationToken } = userInfo;

                try {
                    const response = await fetch(`http://sfm.hnair.net/sfm-admin/sys/sysfltseguser/listCurrent?page=1&limit=99999&startFltDate=${startFltDate}&endFltDate=${endFltDate}&attrType=%E5%9B%BD%E5%86%85`, {
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
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const data = await response.json();
                    console.log("fetch结果:", data);
                    const list = data.obj.list;

                    // 将数据保存到 sessionStorage
                    sessionStorage.setItem('fltNosData', JSON.stringify(list));

                    // 返回处理后的选项数据
                    return list.map(item => ({
                        username: item.username,
                        account: item.account,
                        userId: item.userId,
                    }));
                } catch (error) {
                    console.error("fetch发生错误:", error);
                    throw error; // 重新抛出错误，让调用者处理
                }
            },

            getDateValues: function getDateValues() {
                const startDateInput = core.$("input[placeholder='开始日期']");
                const endDateInput = core.$("input[placeholder='结束日期']");

                const startFltDate = startDateInput ? startDateInput.value : '';
                const endFltDate = endDateInput ? endDateInput.value : '';

                return { startFltDate, endFltDate };
            },

            handleSelectClick: async function handleSelectClick(selectedValue) {
                const fltNosResults = JSON.parse(sessionStorage.getItem('fltNosResults')) || [];
                const existingResult = fltNosResults.find(item => item.userId.toString() === selectedValue);

                if (existingResult) {
                    console.log("已经存在相同userId的数据，无需重新fetch");
                    return;
                }

                const fltNosData = JSON.parse(sessionStorage.getItem('fltNosData')) || [];
                const userSpecificData = fltNosData.filter(item => item.userId.toString() === selectedValue);

                const userInfo = userSpecificData.map(item => ({
                    userId: item.userId,
                    account: item.account,
                    username: item.username,
                    origin: item.origin,
                    dest: item.dest,
                    airRoute: item.airRoute
                }));

                console.log("用户信息:", userInfo);

                const fetchPromises = userInfo.map(async user => {
                    const seg = `${user.origin}${user.dest}`;
                    const { startFltDate, endFltDate } = dataFetcher.getDateValues();
                    const { token: authorizationToken } = state.userInfo;
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
                    user.fltNos = data.obj;
                    return user;
                });

                const results = await Promise.all(fetchPromises);
                fltNosResults.push(...results);
                sessionStorage.setItem('fltNosResults', JSON.stringify(fltNosResults));
                console.log("已更新 sessionStorage 中的 fltNosResults:", fltNosResults);
            },
        };

        // 数据存储模块
        const dataStorage = {
            saveMenuData: function(data) {
                sessionStorage.setItem('menuData', JSON.stringify(data));
                state.menuData = data;
                console.log('已经获取了排除航班类型数据:', data);
            },

            saveLeaderData: function(data) {
                sessionStorage.setItem('leaderData', JSON.stringify(data));
                state.leaderData = data;
                console.log('已经获取了领导人列表数据:', data);
            },

            clearFilteredFlightList: function() {
                sessionStorage.removeItem('filteredFlightList');
                state.filteredFlightList = null;
            }
        };

        return {
            init: function(mutations) {
                eventManager.init(mutations);
            },
            handleSelectClick: dataFetcher.handleSelectClick.bind(dataFetcher),
            fetchUserList: dataFetcher.fetchUserList.bind(dataFetcher),
        };
    });

    ModuleSystem.define('excludeFlight', ['core', 'state', 'uiOperations'], function(core, state, uiOperations) {
        let isFillingForm = false;

        if (!core.isFeatureEnabled("k_quickNavigation")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        async function fillExcludeForm() {

            if (isFillingForm) {
                console.log('表单填充正在进行中，跳过本次调用');
                return;
            }

            const reportNewButton = Array.from(document.querySelectorAll('button.ant-btn.ant-btn-primary'))
            .find(btn => btn.textContent.includes('呈报新排除航班'));

            const excludeFlightInfo = JSON.parse(sessionStorage.getItem('excludeFlightInfo') || 'null');
            const currentModule = JSON.parse(sessionStorage.getItem('currentModule') || 'null');

            if (!reportNewButton || !excludeFlightInfo || !currentModule) return;

            isFillingForm = true;
            console.log('开始填充表单');

            try {
                await core.delay(1000);

                reportNewButton.click();
                console.log('已点击"呈报新排除航班"按钮');

                await core.delay(400);
                await autoFillBasic();

                await core.delay(200);
                const addNewButton = Array.from(document.querySelectorAll('button.ant-btn.ant-btn-primary'))
                .find(btn => btn.textContent.includes('添加'));
                if (addNewButton) addNewButton.click();

                await core.delay(200);
                await autoFillForms();

                await core.delay(100);
                const confirmButton = Array.from(document.querySelectorAll('button.ant-btn.ant-btn-primary'))
                .find(btn => btn.textContent.includes('确'));
                if (confirmButton) confirmButton.click();

            } catch (error) {
                console.error('填充表单过程中发生错误:', error);
            } finally {
                isFillingForm = false;
                sessionStorage.removeItem('currentModule');
                sessionStorage.removeItem('currentJob');
                sessionStorage.removeItem('excludeFlightInfo');
                console.log('表单填充结束');
            }
        }

        async function autoFillBasic() {
            function formatDate(dateString) {
                const date = new Date(dateString);
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
            }

            try {
                const excludeFlightInfo = JSON.parse(sessionStorage.getItem('excludeFlightInfo') || 'null');
                const currentModule = JSON.parse(sessionStorage.getItem('currentModule') || 'null');
                const formattedDate = formatDate(excludeFlightInfo.date);
                const title = `${formattedDate}${excludeFlightInfo.origin}${excludeFlightInfo.dest}排除${currentModule}`;
                await uiOperations.fillInput('#basic_flowInstanceName', title);
                await uiOperations.fillTextArea('#basic_remark', '请领导审批');
            } catch (error) {
                console.error('自动填充基本信息失败:', error);
            }
        }

        async function autoFillForms() {
            function calculateDCP(flightDate) {
                const today = new Date();
                const flight = new Date(flightDate);
                const diffTime = Math.abs(flight - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays;
            }

            const excludeFlightInfo = JSON.parse(sessionStorage.getItem('excludeFlightInfo') || 'null');
            const currentModule = JSON.parse(sessionStorage.getItem('currentModule') || 'null');
            const currentJob = JSON.parse(sessionStorage.getItem('currentJob') || 'null');
            const leaderData = JSON.parse(sessionStorage.getItem('leaderData') || 'null');

            if (!excludeFlightInfo.flightNumber) {
                console.error('currentFlightInfo 不存在或不完整');
                return;
            }

            const airline = excludeFlightInfo.flightNumber.substring(0, 2);

            try {
                await uiOperations.fillDatePicker('#fltDate', excludeFlightInfo.date);
                await uiOperations.fillDatePicker('input[placeholder="结束日期"]', excludeFlightInfo.date);
                await uiOperations.fillInput('#route', excludeFlightInfo.segment);
                await uiOperations.selectDropdownOption('#airline', airline);
                await uiOperations.selectDropdownOption('#module', currentModule);
                await uiOperations.selectDropdownOption('#jobName', currentJob);
                await uiOperations.fillInput('#seg', excludeFlightInfo.origin + excludeFlightInfo.dest);
                if (currentModule.includes('公务')) {
                    await uiOperations.selectDropdownOption('#applicableCabin', '公务舱');
                } else {
                    await uiOperations.selectDropdownOption('#applicableCabin', '经济舱');
                }
                await uiOperations.fillInput('#fltNo', excludeFlightInfo.flightNumber);
                await uiOperations.fillInput('#startDcp', '0');
                const dcp = calculateDCP(excludeFlightInfo.date);
                await uiOperations.fillInput('#endDcp', dcp.toString());
                await uiOperations.selectDropdownOption('#approveLead', leaderData[0]);
                const reason = "为了确保航班正常销售，特此申请暂时剔除自动化调整规则，以便根据实时市场情况灵活调整。";
                await uiOperations.fillTextArea('#reason', reason);
            } catch (error) {
                console.error('自动填充表单失败:', error);
            }
        }

        return {
            init: function() {
                fillExcludeForm();
            },
        };
    });

    ModuleSystem.define('batchPolicy', ['core', 'state', 'uiOperations'], function(core, state, uiOperations) {

        if (!core.isFeatureEnabled("k_bulkCabinChange")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        // 私有变量
        const STORAGE_KEY = 'cabinPricePolicyStorage';
        const EDIT_LOCK_KEY = 'cabinPricePolicyEditLock';

        // 私有函数
        function getCabinPricePolicyStorage() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        }

        function saveCabinPricePolicyStorage(data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }


        function setEditLock() {
            localStorage.setItem(EDIT_LOCK_KEY, 'true');
        }

        function releaseEditLock() {
            localStorage.removeItem(EDIT_LOCK_KEY);
        }

        function isEditLocked() {
            return localStorage.getItem(EDIT_LOCK_KEY) === 'true';
        }

        function updateCabinPricePolicy(flightNumber, date, segment, cabin, newPrice) {

            if (isEditLocked()) {
                window.top.message.warning("另一个窗口正在编辑，请稍后再试");
                return;
            }

            setEditLock();

            try {
                const storage = getCabinPricePolicyStorage();
                const segmentCode = segment.substring(0, 6);

                if (!storage[segmentCode]) storage[segmentCode] = {};
                if (!storage[segmentCode][flightNumber]) storage[segmentCode][flightNumber] = {};
                if (!storage[segmentCode][flightNumber][date]) storage[segmentCode][flightNumber][date] = {};

                storage[segmentCode][flightNumber][date][cabin] = newPrice;
                saveCabinPricePolicyStorage(storage);
                console.log(`Updated price for ${segmentCode} ${flightNumber} ${date} ${cabin}: ${newPrice}`);
            } catch (error) {
                console.error('Error updating cabin price policy:', error);
                window.top.message.error("更新舱位价格策略时出错");
            } finally {
                releaseEditLock();
            }
        }

        function fetchInitialCellValues() {
            const targetElement = core.$('#cabin-control-id .ant-table-tbody');
            if (!targetElement || targetElement.dataset.initialValuesFetched) return;

            targetElement.dataset.initialValuesFetched = 'true';

            const tableBody = core.$('.ant-spin-container .ant-table-content .ant-table-tbody');
            if (tableBody) {
                const cells = tableBody.querySelectorAll('.ant-table-row.ant-table-row-level-0 .ant-table-cell');
                if (cells.length >= 2) {
                    state.initialValues = {
                        ...state.initialValues,
                        firstCell: cells[0].textContent.trim(),
                        secondCell: cells[1].textContent.trim()
                    };
                }
            }

            const tabPanes = core.$$('.tabpane-div');
            tabPanes.forEach(tabPane => {
                const parentDiv = tabPane.closest('div[role="tab"]');
                if (parentDiv && parentDiv.getAttribute('aria-disabled') === 'true') {
                    state.initialValues = {
                        ...state.initialValues,
                        tabPane: tabPane.textContent.trim()
                    };
                }
            });

            if (!state.initialValues.firstCell || !state.initialValues.secondCell || !state.initialValues.tabPane) {
                window.top.message.error("获取初始值失败：部分数据缺失");
            }
        }

        async function addBatchButton() {

            const targetModal = core.$('.react-draggable .ant-modal-content');
            if (!targetModal) return;

            const container = targetModal.querySelector('.ant-row[style*="justify-content: flex-end;"]');
            if (!container || container.querySelector('.batch-add-button')) return;

            const batchButton = document.createElement('button');
            batchButton.type = 'button';
            batchButton.className = 'ant-btn ant-btn-primary batch-add-button';
            batchButton.style.marginRight = '20px';
            batchButton.innerHTML = '<span>批量添加</span>';

            batchButton.addEventListener('click', handleBatchAddClick);
            addNextStepButtonListener();

            container.appendChild(batchButton);
        }

        async function handleBatchAddClick() {
            const targetModal = core.$('.react-draggable .ant-modal-content');
            if (!targetModal) {
                console.error('未找到目标模态框');
                return;
            }

            const applyReasonTextarea = targetModal.querySelector('#basic_applyReason');
            if (applyReasonTextarea) {
                await uiOperations.fillTextArea('#basic_applyReason', '跟进CA、CZ、MU');
            }

            const tableBody = targetModal.querySelector('.ant-table-tbody');
            if (!tableBody) {
                console.error('未找到表格的tbody');
                return;
            }

            const cabinPricePolicyStorage = getCabinPricePolicyStorage();
            let totalUpdates = 0;
            let failedUpdates = 0;

            if (Object.keys(cabinPricePolicyStorage).length > 0) {
                const firstRowCheckbox = tableBody.querySelector('.ant-table-row.ant-table-row-level-0 .ant-table-cell.ant-table-selection-column input[type="checkbox"]');
                if (firstRowCheckbox) {
                    firstRowCheckbox.click();
                    await core.delay(200); // 等待复选框状态更新
                }

                for (const segment in cabinPricePolicyStorage) {
                    for (const flightNumber in cabinPricePolicyStorage[segment]) {
                        for (const date in cabinPricePolicyStorage[segment][flightNumber]) {
                            for (const cabin in cabinPricePolicyStorage[segment][flightNumber][date]) {
                                const price = cabinPricePolicyStorage[segment][flightNumber][date][cabin];
                                try {
                                    await addNewRow(tableBody, { segment, flightNumber, date, cabin, price });
                                    totalUpdates++;
                                    await core.delay(200); // 在每次添加行后增加延迟，确保UI更新
                                } catch (error) {
                                    console.error(`添加行失败: ${segment} ${flightNumber} ${date} ${cabin}`, error);
                                    failedUpdates++;
                                }
                            }
                        }
                    }
                }
            }

            console.log(`添加了 ${totalUpdates} 个舱位价格更新到表格中, ${failedUpdates} 个失败`);
            if (failedUpdates > 0) {
                window.top.message.warning(`${failedUpdates} 个舱位价格更新失败，请检查日志`);
            }
        }

        function addNextStepButtonListener() {
            const modalContent = document.querySelector('.ant-modal-content');
            if (!modalContent) {
                console.log('未找到模态框内容');
                return;
            }

            const nextStepButton = Array.from(modalContent.querySelectorAll('button.ant-btn.ant-btn-primary'))
            .find(button => button.textContent.trim() === '下一步');

            if (nextStepButton) {
                nextStepButton.addEventListener('click', () => {
                    localStorage.removeItem(STORAGE_KEY);
                    console.log('已清空 cabinPricePolicyStorage');
                });
            } else {
                console.log('未找到"下一步"按钮');
            }
        }

        async function addNewRow(tableBody, data) {
            const copyAddButton = tableBody.closest('.ant-modal-content').querySelector('button.ant-btn.ant-btn-primary:first-child');
            if (!copyAddButton) {
                console.error('未找到"复制添加"按钮');
                return;
            }

            copyAddButton.click();
            await core.delay(300);

            const newRow = tableBody.querySelector('.ant-table-row.ant-table-row-level-0:last-child');
            const cells = newRow.querySelectorAll('.ant-table-cell');

            await uiOperations.updateTableCell(cells[3], data.segment.substring(0, 3));
            await uiOperations.updateTableCell(cells[4], data.segment.substring(3, 6));
            await uiOperations.updateTableCell(cells[5], data.flightNumber);
            await uiOperations.updateTableCell(cells[7], data.cabin);
            await uiOperations.updateTableCell(cells[8], data.price.toString());
            await uiOperations.updateTableCell(cells[9], data.date);
            await uiOperations.updateTableCell(cells[10], data.date);

            const newRowCheckbox = newRow.querySelector('.ant-table-cell.ant-table-selection-column input[type="checkbox"]');
            if (newRowCheckbox) {
                newRowCheckbox.checked = false;
                newRowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        function addDoubleClickHandler() {
            const targetElement = core.$('#cabin-control-id .ant-table-tbody');
            if (!targetElement) return;

            const rows = targetElement.querySelectorAll('.ant-table-row.ant-table-row-level-0');
            for (const row of rows) {
                const firstCell = row.querySelector('.ant-table-cell:nth-child(1)');
                if (firstCell && firstCell.dataset.doubleClickBound) break;

                const seventhCell = row.querySelector('.ant-table-cell:nth-child(7)');

                if (firstCell && !firstCell.dataset.doubleClickBound && seventhCell && seventhCell.querySelector('input[type="checkbox"]')) {
                    firstCell.dataset.oldValue = firstCell.textContent.trim();
                    firstCell.dataset.doubleClickBound = 'true';
                    firstCell.addEventListener('dblclick', () => makeCellEditable(firstCell));
                }
            }
        }

        function makeCellEditable(cell) {
            const currentText = cell.textContent.trim();
            cell.dataset.oldValue = currentText;
            const [cabin, price] = extractCabinAndPrice(currentText);

            const input = document.createElement('input');
            input.type = 'text';
            input.value = price || '';
            input.style.width = "100%";
            cell.innerHTML = '';
            cell.appendChild(input);
            input.focus();

            input.addEventListener('blur', () => {
                const newValue = input.value.trim();
                if (newValue !== (price || '')) {
                    updateCellValue(cell, cabin, newValue);
                } else {
                    cell.textContent = currentText;
                }
            });
            input.addEventListener('keydown', (event) => {
                if (event.key === "Enter") {
                    input.blur();
                }
            });
        }

        function extractCabinAndPrice(text) {
            const match = text.match(/^([A-Z])(\d+)?$/);
            return match ? [match[1], match[2] || ''] : [text, ''];
        }

        function updateCellValue(cell, cabin, newPrice) {
            const oldValue = cell.dataset.oldValue || '';
            const flightNumber = state.initialValues.firstCell;
            const date = state.initialValues.secondCell.replace(/-/g, '/');
            const segment = state.initialValues.tabPane.substring(0, 6);

            if (!/^\d+$/.test(newPrice)) {
                window.top.message.error("请输入正确的价格");
                cell.textContent = oldValue;
                return;
            }

            const price = parseInt(newPrice, 10);

            updateCabinPricePolicy(flightNumber, date, segment, cabin, price);

            const newCellContent = cabin + price.toString();
            cell.textContent = newCellContent;
            cell.style.color = 'red';
            cell.style.fontWeight = 'bold';
        }

        function updateInitialPrices() {
            const cabinPricePolicyStorage = getCabinPricePolicyStorage();

            const targetElement = core.$('#cabin-control-id .ant-table-tbody');
            if (!targetElement) return;

            if (!state.initialValues.firstCell || !state.initialValues.secondCell || !state.initialValues.tabPane) return;

            const flightNumber = state.initialValues.firstCell;
            const date = state.initialValues.secondCell.replace(/-/g, '/');
            const segment = state.initialValues.tabPane.substring(0, 6);

            const priceData = cabinPricePolicyStorage[segment]?.[flightNumber]?.[date];

            if (!priceData) {
                //console.log('未找到匹配的价格数据');
                return;
            }

            const rows = core.$$('#cabin-control-id .ant-table-tbody .ant-table-row.ant-table-row-level-0');
            rows.forEach(row => {
                const cabinCell = row.querySelector('.ant-table-cell:nth-child(1)');
                if (cabinCell) {
                    const cabin = cabinCell.textContent.trim();
                    if (priceData[cabin]) {
                        cabinCell.textContent = cabin + priceData[cabin];
                        cabinCell.style.color = 'red';
                        cabinCell.style.fontWeight = 'bold';
                    }
                }
            });
        }

        // 公共接口
        return {
            init: function() {
                fetchInitialCellValues();
                updateInitialPrices();
                addDoubleClickHandler();
                addBatchButton();
            },
            getCabinPricePolicy: function(flightNumber, date, segment) {
                const storage = getCabinPricePolicyStorage();
                const segmentCode = segment.substring(0, 6);
                return storage[segmentCode]?.[flightNumber]?.[date] || null;
            },
            clearCabinPricePolicyStorage: function() {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        };
    });

    ModuleSystem.define('batchAVJ', ['core', 'state', 'uiOperations', 'dataEventManager'], function(core, state, uiOperations, dataEventManager) {
        // 检查功能是否启用
        if (!core.isFeatureEnabled("k_batchavjlong")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        let fetchExecuted = false;
        const addedUsers = new Set();

        function createLabel() {
            const label = document.createElement('div');
            label.className = "ant-col ant-col-1 ant-form-item-label";
            label.innerHTML = '<label for="select_user" class="ant-form-item-required" title="航管">航管</label>';
            return label;
        }

        function createSelectContainer() {
            const container = document.createElement('div');
            container.className = "ant-col ant-col-2 ant-form-item-control";
            container.innerHTML = `
            <div class="ant-form-item-control-input">
                <div class="ant-form-item-control-input-content">
                    <div id="select_container"></div>
                </div>
            </div>
        `;
            return container;
        }

        function createBatchQueryButton() {
            const container = document.createElement('div');
            container.className = "ant-col ant-col-2";
            const button = document.createElement('button');
            button.id = "batchQueryButton";
            button.className = "ant-btn ant-btn-primary";
            button.innerHTML = '<span>批量查询</span>';
            button.addEventListener('click', handleBatchQuery);
            container.appendChild(button);
            return container;
        }

        function setupAntSelect() {
            const selectContainer = core.$('#select_container');
            if (selectContainer) {
                const select = document.createElement('select');
                select.id = 'select_user';
                select.className = 'ant-select ant-select-in-form-item ant-select-single ant-select-allow-clear ant-select-show-arrow ant-select-show-search';
                selectContainer.appendChild(select);

                selectContainer.addEventListener('click', () => {
                    if (!fetchExecuted) {
                        executeFetchAndPopulateSelect(select);
                        fetchExecuted = true;
                    }
                });
            }
        }

        async function executeFetchAndPopulateSelect(select) {
            try {
                const { startFltDate, endFltDate } = getDateValues();
                const options = await dataEventManager.fetchUserList(startFltDate, endFltDate);
                addOptionsToSelect(select, options);
            } catch (error) {
                console.error("获取用户列表失败:", error);
                window.top.message.error("获取用户列表失败，请重试");
            }
        }

        function addOptionsToSelect(select, options) {
            const userInfo = state.userInfo;
            const currentUserOption = options.find(option => option.account === userInfo.account);
            const otherOptions = options.filter(option => option.account !== userInfo.account);

            if (currentUserOption) {
                addOption(select, currentUserOption);
            }

            otherOptions.forEach(option => {
                if (!addedUsers.has(option.account)) {
                    addOption(select, option);
                    addedUsers.add(option.account);
                }
            });

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

        async function handleBatchQuery() {
            console.log("批量查询按钮被点击");

            const selectUser = core.$('#select_user');
            const selectedValue = selectUser ? selectUser.value : null;
            console.log("当前选择的值:", selectedValue);

            if (!selectedValue) {
                window.top.message.error("请选择航管");
                return;
            }

            try {
                await dataEventManager.handleSelectClick(selectedValue);
                await updateSegInput();
                await updateFltNosInput();
                clickQueryButton();
            } catch (error) {
                console.error("批量查询过程中发生错误:", error);
                window.top.message.error("批量查询失败，请重试");
            }
        }

        async function updateSegInput() {
            const segInput = core.$("input#seg[placeholder='请填写']");
            if (!segInput) return;

            await uiOperations.fillInput("input#seg[placeholder='请填写']", "");
            await uiOperations.fillInput("input#seg[placeholder='请填写']", "ALLSEG");
        }

        async function updateFltNosInput() {
            const fltNosInputWrapper = core.$("#fltNos .ant-select-selection-search-input");
            if (!fltNosInputWrapper) return;

            fltNosInputWrapper.removeAttribute('readonly');
            fltNosInputWrapper.removeAttribute('unselectable');
            fltNosInputWrapper.style.opacity = 1;

            fltNosInputWrapper.focus();
            fltNosInputWrapper.click();

            await core.delay(100);

            await uiOperations.fillInput("#fltNos .ant-select-selection-search-input", "ALLSEG");

            await core.delay(500);

            const dropdown = core.$(".ant-select-dropdown");
            if (dropdown) {
                const option = Array.from(dropdown.querySelectorAll('.ant-select-item-option-content'))
                .find(el => el.textContent.includes("ALLSEG"));
                if (option) option.click();
            }

            fltNosInputWrapper.dispatchEvent(new Event('blur', { bubbles: true }));

            const fltNosWrapper = core.$("#fltNos");
            if (fltNosWrapper) fltNosWrapper.click();
        }

        function clickQueryButton() {
            const queryButton = Array.from(core.$$("button.ant-btn.ant-btn-primary"))
            .find(button => button.textContent.includes("查询"));

            if (queryButton) {
                queryButton.click();
                console.log("查询按钮被点击");
            } else {
                console.log("查询按钮未找到");
            }
        }

        async function setInputValue(input, value) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, value);

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            await core.delay(100);
        }

        function getDateValues() {
            const startDateInput = core.$("input[placeholder='开始日期']");
            const endDateInput = core.$("input[placeholder='结束日期']");

            const startFltDate = startDateInput ? startDateInput.value : '';
            const endFltDate = endDateInput ? endDateInput.value : '';

            return { startFltDate, endFltDate };
        }

        function init() {
            const formElement = core.$("form.ant-form.ant-form-horizontal");
            if (!formElement) return;

            const rowContainer = core.$("div.ant-row[style='padding: 0px 24px;']");
            if (!rowContainer || document.querySelector("#batchQueryButton")) return;

            const elementToRemove = core.$("div.ant-col.ant-col-2[style='padding-top: 5px;']");
            if (elementToRemove) elementToRemove.remove();

            const existingElement = core.$("div.ant-col.ant-col-4[style='padding-top: 5px;']");
            if (existingElement) existingElement.className = "ant-col ant-col-3";

            rowContainer.appendChild(createLabel());
            rowContainer.appendChild(createSelectContainer());
            rowContainer.appendChild(createBatchQueryButton());

            setupAntSelect();
        }

        return {
            init: init
        };
    });

    ModuleSystem.define('tableFilterModule', ['core', 'state', 'batchAVJ'], function(core, state, batchAVJ) {

        // 检查功能是否启用
        if (!core.isFeatureEnabled("k_batchavjlong")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        // 私有变量和函数
        const DEBOUNCE_DELAY = 1000;

        function isDateInRange(date, startDate, endDate) {
            return date >= startDate && date <= endDate;
        }

        function getSegmentsInfo() {
            const selectElement = core.$('#select_user');
            const selectedValue = selectElement ? selectElement.value : null;
            console.log("获取到当前点击的用户是:", selectedValue);

            const fltNosResults = JSON.parse(sessionStorage.getItem('fltNosResults')) || [];
            console.log("fltNosResults:", fltNosResults);
            const userSpecificData = fltNosResults.filter(item => item.userId.toString() === selectedValue);
            console.log("userSpecificData:", userSpecificData);

            const uniqueSegmentsSet = new Set(userSpecificData.map(item => `${item.origin}${item.dest}`));
            const segmentsInfo = Array.from(uniqueSegmentsSet);
            console.log("Unique segmentsInfo:", segmentsInfo);

            return segmentsInfo;
        }

        function filterTableRows() {
            const startDate = core.$(`input[placeholder="开始日期"]`).value;
            const endDate = core.$(`input[placeholder="结束日期"]`).value;
            const segmentValue = core.$(`input#seg`).value;
            const segmentsInfo = getSegmentsInfo();
            console.log("segmentsInfo:", segmentsInfo);

            if (!startDate || !endDate || !segmentValue) {
                console.warn("无法获取开始日期、结束日期或航段值");
                return;
            }

            const tbody = core.$('tbody.ant-table-tbody');
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

                    let shouldRemove = !isDateInRange(date, startDate, endDate);

                    if (segmentValue.toUpperCase() === "ALLSEG") {
                        shouldRemove = shouldRemove || !segmentsInfo.includes(segment.toUpperCase());
                    } else {
                        shouldRemove = shouldRemove || (segment.toUpperCase() !== segmentValue.toUpperCase());
                    }

                    if (shouldRemove) {
                        console.log('删除了不符合的行:', row);
                        row.remove();
                    }
                });
            }
        }

        const observeTableChanges = core.debounce(() => {
            const fltNosWrapper = core.$('#fltNos');
            if (!fltNosWrapper) return;

            const formElement = core.$('form.ant-form.ant-form-horizontal');
            if (formElement) {
                const tbody = core.$('tbody.ant-table-tbody');
                if (tbody) {
                    const observer = new MutationObserver((mutations) => {
                        const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
                        if (hasAddedNodes) {
                            console.log('找到了表格元素并开启监控');
                            filterTableRows();
                            observer.disconnect();
                        }
                    });
                    observer.observe(tbody, { childList: true, subtree: true });
                }
            }
        }, DEBOUNCE_DELAY);

        // 公共接口
        return {
            init: function() {
                observeTableChanges();
            }
        };
    });

    ModuleSystem.define('elementObserver', ['core', 'state','config', 'indicesManager'], function(core, state,config, indicesManager) {

        if (!core.isFeatureEnabled("priceDisplay") && !core.isFeatureEnabled("syncDisplay") || !core.$('#refresh')) {
            return { init: function() {} };
        }

        // 在航班调整页面，发起调价的时候，也会出来一个table，可能会引起监控的性能问题。
        // 排除这个页面
        function isInPriceAdjustmentModal() {
            const modalTitle = document.querySelector('.ant-modal-title div');
            return modalTitle && modalTitle.textContent.trim() === '发起调价';
        }

        function onElementHover(event) {
            if (isInPriceAdjustmentModal()) {
                return; // 如果在"发起调价"模态框中，直接返回
            }
            requestAnimationFrame(() => {
                // 重置状态
                state.currentElementType = null;
                state.PriceList = null;
                state.currentFlightInfo = null;

                const targetCell = event.target.closest('.art-table-cell');
                if (!targetCell) return;

                // 检查是否是"暂无数据"的情况
                if (targetCell.querySelector('.ant-empty-description')) {
                    //console.log('Table is empty, no data available');
                    return;
                }

                const row = targetCell.closest('.art-table-row');
                if (!row || row.classList.contains('no-hover')) return;

                // 尝试获取航班信息和元素类型，并进行错误处理
                let flightInfo, elementType;
                try {
                    flightInfo = getFlightInfo(row);
                    elementType = getElementType(targetCell, row);
                } catch (error) {
                    console.warn('Error in getting flight info or element type:', error);
                    console.log('targetCell', targetCell);
                    console.log('row', row);
                    return; // 如果出错，直接返回
                }

                // 检查 flightInfo 和 elementType 是否有效
                if (!flightInfo || !elementType) {
                    console.warn('Invalid flight info or element type');
                    return;
                }

                // 更新状态
                state.currentFlightInfo = flightInfo;
                state.currentElementType = elementType;

                const { airCompony } = state.userInfo;

                // 检查是否需要获取价格列表
                if ((elementType === config.ELEMENT_TYPES.ECONOMIC_PRICE ||
                     elementType === config.ELEMENT_TYPES.BUSINESS_PRICE) &&
                    (flightInfo.flightNumber.includes(airCompony) || flightInfo.flightNumber.includes('CN'))) {
                    try {
                        state.PriceList = getPricesList(targetCell, state.currentElementType);
                    } catch (error) {
                        console.warn('Error in getting price list:', error);
                        state.PriceList = null; // 如果获取价格列表失败，设置为 null
                    }
                }

                // 用于调试的日志输出（可以根据需要启用）
                //console.log("state.currentFlightInfo", state.currentFlightInfo);
                // console.log("state.currentElementType", state.currentElementType);
                // console.log("state.PriceList", state.PriceList);
            });


        }

        function getElementType(cell, row) {
            const cells = Array.from(row.children).filter(child => child.classList.contains('art-table-cell'));
            const isFirstCellSpecial = cells[0].classList.contains('first');
            const { dateFlightIndex, economicPriceIndex, businessPriceIndex } = indicesManager.calculateIndices(isFirstCellSpecial);

            const cellIndex = cells.indexOf(cell);

            if (cellIndex === dateFlightIndex) {
                return config.ELEMENT_TYPES.DATE_FLIGHT;
            } else if (cellIndex === economicPriceIndex) {
                return config.ELEMENT_TYPES.ECONOMIC_PRICE;
            } else if (cellIndex === businessPriceIndex) {
                return config.ELEMENT_TYPES.BUSINESS_PRICE;
            } else {
                return config.ELEMENT_TYPES.OTHER;
            }
        }

        function getFlightInfo(row) {

            const cells = Array.from(row.children).filter(child => child.classList.contains('art-table-cell'));
            const isFirstCellSpecial = cells[0].classList.contains('first');
            const { dateFlightIndex } = indicesManager.calculateIndices(isFirstCellSpecial);

            const dateFlightCell = cells[dateFlightIndex];
            const dateFlightElement = dateFlightCell.querySelector('[id^="data-"]');
            if (!dateFlightElement) return null;

            const idParts = dateFlightElement.id.split('-');
            const date = `${idParts[1]}-${idParts[2]}-${idParts[3]}`;
            const flightNumber = idParts[4];

            const filteredFlightList = JSON.parse(sessionStorage.getItem('filteredFlightList') || 'null');

            if (!filteredFlightList || !Array.isArray(filteredFlightList)) {
                console.log('filteredFlightList is null or not an array');
                return null;
            }

            const userInfo = state.userInfo;
            const { airCompony } = userInfo;

            const matchedFlight = filteredFlightList.find(flight => {
                return flight.fltDate.split(' ')[0] === date && flight.fltNo === flightNumber ;
            });

            if (!matchedFlight) return null;

            const airRoute = matchedFlight.airRoute.replace(/-/g, '');

            return {
                date: date,
                flightNumber: flightNumber,
                segment: airRoute,
                origin: matchedFlight.origin,
                dest: matchedFlight.dest
            };
        }

        function getPricesList(target, priceType) {
            //console.log('Getting prices list for', priceType);
            const parentTBody = target.closest('tbody');
            if (!parentTBody) return [];

            const rows = parentTBody.querySelectorAll('.art-table-row');
            const flightData = [];

            rows.forEach(row => {
                const cells = Array.from(row.children).filter(child => child.classList.contains('art-table-cell'));
                if (!cells.length) return;

                const isFirstCellSpecial = cells[0].classList.contains('first');
                const { dateFlightIndex, economicPriceIndex, businessPriceIndex } = indicesManager.calculateIndices(isFirstCellSpecial);

                const dateFlightCell = cells[dateFlightIndex];
                const dateFlightElement = dateFlightCell.querySelector('[id^="data-"]');
                if (!dateFlightElement || !dateFlightElement.id) return;

                const [, year, month, day, flightNumber] = dateFlightElement.id.split('-');
                const flightDate = new Date(year, month - 1, day);
                flightDate.setHours(0, 0, 0, 0);

                let price;
                if (priceType === config.ELEMENT_TYPES.ECONOMIC_PRICE) {
                    price = extractPrice(cells[economicPriceIndex]);
                } else if (priceType === config.ELEMENT_TYPES.BUSINESS_PRICE) {
                    price = extractPrice(cells[businessPriceIndex]);
                }

                if (price !== null) {
                    flightData.push({
                        date: flightDate,
                        flightNumber,
                        [priceType]: price,
                    });
                }
            });

            //console.log('Flight data:', flightData);
            return flightData;
        }

        function extractPrice(cell) {
            if (!cell) return null;
            const text = cell.innerText.trim();
            if (text === "--") return null;
            const match = text.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
        }

        function setupEventListeners(container) {
            container.removeEventListener('mouseover', onElementHover);
            container.addEventListener('mouseover', onElementHover);
        }

        return {
            init: function() {

                if (!state.globalIndices) {
                    //console.log("globalIndices not set");
                    return;
                }

                const tableContainer = core.$('.art-table');
                if (tableContainer) {
                    setupEventListeners(tableContainer);
                }
            },
            getFlightInfo: getFlightInfo,
        };
    });

    ModuleSystem.define('tooltipObserver', ['core', 'state', 'config'], function(core, state, config) {

        if (!core.isFeatureEnabled("priceDisplay") && !core.isFeatureEnabled("syncDisplay")) {
            return { init: function() {} }; // 返回空的初始化函数
        }

        // Utility functions
        const dateDiffInDays = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));
        const createPureDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

        function processSyncDatePriceData(additionalData, targetFlight, targetDate) {
            let additionalContent = '';
            const horizontalLine = '<hr style="border: none; border-top: 1px solid white;">';

            additionalData.forEach(item => {
                const itemFltDate = new Date(item.fltDate);
                itemFltDate.setHours(0, 0, 0, 0);
                if (item.fltNo === targetFlight && itemFltDate.getTime() === targetDate.getTime()) {
                    const remark = JSON.parse(item.remark || '{}');
                    let firstPart = '';
                    let secondPart = '';
                    const fourthPart = `<div>成本价格: ${remark["保变价格"]}</div>`;
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
                        additionalContent += `${horizontalLine}${firstPart}${horizontalLine}${secondPart}${horizontalLine}${fourthPart}${horizontalLine}${thirdPart}`;
                    } else if (secondPart) {
                        additionalContent += `${horizontalLine}${secondPart}${horizontalLine}${fourthPart}${horizontalLine}${thirdPart}`;
                    }
                }
            });

            return additionalContent;
        }

        function processPriceDiffData(fetchedData, targetFlight, targetDate, today) {

            let content = '';
            const flightsData = {};

            fetchedData.forEach(entry => {
                const daysDifference = dateDiffInDays(targetDate, today);
                const pureEffectiveDateStart = createPureDate(new Date(entry.effectiveDateStart));
                const pureEffectiveDateEnd = createPureDate(new Date(entry.effectiveDateEnd));
                const pureTargetDate = createPureDate(targetDate);

                const matchesFltNo = (entry.compFltNo.includes(targetFlight));
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

        function getLowestPrice(cabinType, fetchedData, flightData, targetDate, today) {

            //console.log("Target Date:", targetDate);
            //console.log("Today:", today);
            //console.log("Cabin Type:", cabinType);
            //console.log("Flight Data:", flightData);
            //console.log("fetched Data:", fetchedData);

            const lowestPrices = [];

            // Step 1: Filter fetchedData to find applicable flight entries
            const applicableEntries = fetchedData.filter(entry => {
                const daysDifference = dateDiffInDays(targetDate, today);
                const effectiveStartDate = new Date(entry.effectiveDateStart);
                const effectiveEndDate = new Date(entry.effectiveDateEnd);
                effectiveStartDate.setHours(0, 0, 0, 0);
                effectiveEndDate.setHours(0, 0, 0, 0);

                const isWithinDate = effectiveStartDate <= targetDate && effectiveEndDate >= targetDate;
                const isWithinDcp = daysDifference >= entry.startDcp && daysDifference <= entry.endDcp;
                const isWithinDow = entry.carryDow.includes((targetDate.getDay() === 0 ? 7 : targetDate.getDay()));
                const idParts = state.currentFlightInfo.flightNumber;
                const matchesFltNo = (entry.airline+entry.fltNo)===(idParts);
                const matchesCabinType = entry.bigCabin === cabinType;

                return isWithinDate && isWithinDcp && isWithinDow && matchesFltNo && matchesCabinType;
            });

            console.log("满足条件的价差列表:", applicableEntries);

            // Step 2: Map applicableEntries to flight numbers and price diffs, considering cabin type
            applicableEntries.forEach(entry => {
                if (entry.bigCabin === cabinType) {
                    entry.compFltNo.split(',').forEach(fltNo => {
                        const flight = flightData.find(f => f.flightNumber === fltNo && f.date.getTime() === targetDate.getTime());
                        if (flight) {
                            console.log(`Searching for flight ${fltNo} on ${targetDate}:`, flight);
                            console.log(`中间计算过程${fltNo}的价差: ${entry.priceDiffStd}`);
                            let calculatedPrice;
                            if (cabinType === '经济舱' && flight.economicPrice) {
                                calculatedPrice = flight.economicPrice + entry.priceDiffStd;
                            } else if (cabinType === '公务舱' && flight.businessPrice) {
                                calculatedPrice = flight.businessPrice + entry.priceDiffStd;
                            }
                            if (calculatedPrice) {
                                lowestPrices.push(calculatedPrice);
                                console.log(`Calculated price for flight ${fltNo}: ${calculatedPrice}`);
                            }
                        }
                    });
                }
            });

            console.log("经过计算后的最低价格:", lowestPrices);

            // Step 3: Find the minimum price from the list of calculated lowest prices
            if (lowestPrices.length > 0) {
                const overallLowestPrice = Math.min(...lowestPrices);
                console.log("Overall Lowest Price:", overallLowestPrice);
                return overallLowestPrice;
            } else {
                console.log("No applicable prices found");
                return null;
            }
        }

        function updateTooltipContent(tooltipElement) {

            const currentFlightInfo = state.currentFlightInfo;
            if (tooltipElement.getAttribute('data-modified')) return;

            const fetchedData = state.globalFetchedData;
            const additionalData = state.globalAdditionalData;
            const userInfo = state.userInfo;
            const { airCompony } = userInfo;

            const targetDate = new Date(currentFlightInfo.date);
            const targetAirCompany = currentFlightInfo.flightNumber.substring(0, 2);
            const targetFlight = currentFlightInfo.flightNumber;
            const today = new Date();
            targetDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            let content = '';

            const elementType = state.currentElementType;

            if (targetAirCompany === airCompony || (airCompony === "HU" && targetAirCompany === "CN")) {
                if (fetchedData && state.PriceList) {
                    if (elementType === config.ELEMENT_TYPES.ECONOMIC_PRICE) {
                        content += "<div>经济舱最低价格：</div>";
                        const cabinType = '经济舱';
                        let price = getLowestPrice(cabinType, fetchedData, state.PriceList, targetDate, today);
                        content += `<div>${price !== null ? price : '未设置一线一策'}</div>`;
                        tooltipElement.innerHTML = content;
                    } else if (elementType === config.ELEMENT_TYPES.BUSINESS_PRICE) {
                        content += "<div>公务舱最低价格：</div>";
                        const cabinType = '公务舱';
                        let price = getLowestPrice(cabinType, fetchedData, state.PriceList, targetDate, today);
                        content += `<div>${price !== null ? price : '未设置一线一策'}</div>`;
                        tooltipElement.innerHTML = content;
                    }
                }
                if (additionalData && !state.PriceList) {
                    if (elementType === config.ELEMENT_TYPES.DATE_FLIGHT) {
                        content += processSyncDatePriceData(additionalData, targetFlight, targetDate);
                        tooltipElement.innerHTML += content;
                    }
                }
            } else {
                if (fetchedData) {
                    if (elementType === config.ELEMENT_TYPES.DATE_FLIGHT) {
                        content += processPriceDiffData(fetchedData, targetFlight, targetDate, today);
                        tooltipElement.innerHTML += content;
                    }
                }
            }

            tooltipElement.setAttribute('data-modified', 'true');
        }

        function isTooltipContentNotValid(tooltipElement) {
            const content = tooltipElement.textContent.trim();
            return content.includes('自动任务') || content.includes('SQL') || content.includes('执行时间');
        }

        return {
            init: function(mutations) {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType !== Node.ELEMENT_NODE) return;

                            if (!state.currentElementType) return;

                            const tooltipElement = node.querySelector('.ant-tooltip');
                            if (tooltipElement && !tooltipElement.classList.contains('ant-tooltip-hidden')) {
                                const tooltipInner = tooltipElement.querySelector('.ant-tooltip-inner');
                                if (tooltipInner && !tooltipInner.getAttribute('data-modified')) {
                                    if (!isTooltipContentNotValid(tooltipInner)) {
                                        updateTooltipContent(tooltipInner);
                                        tooltipInner.setAttribute('data-modified', 'true');
                                    }
                                }
                            }
                        });
                    }
                });
            }
        };
    });

    ModuleSystem.define('controller', ['core', 'state', 'menuManager', 'indicesManager', 'apiHookManager', 'enhanceUI', 'enhanceUIWithContextMenu', 'dataEventManager', 'excludeFlight','batchPolicy', 'batchAVJ','tableFilterModule', 'elementObserver', 'tooltipObserver'],
                        function(core, state, menuManager, indicesManager, apiHookManager, enhanceUI, enhanceUIWithContextMenu, dataEventManager, excludeFlight, batchPolicy, batchAVJ, tableFilterModule, elementObserver, tooltipObserver) {

        function loadDefaultAction() {
            // 初始化其他不依赖 MutationObserver 的模块...
            menuManager.init();
            apiHookManager.init();
            indicesManager.init();
        }

        function initObserver() {
            const observer = new MutationObserver((mutations, obs) => {
                const hasAddedNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
                if (hasAddedNodes) {
                    menuManager.init();
                    enhanceUI.init();
                    enhanceUIWithContextMenu.init();
                    dataEventManager.init(mutations);
                    excludeFlight.init();
                    batchPolicy.init();
                    batchAVJ.init();
                    tableFilterModule.init();
                    elementObserver.init(mutations);
                    tooltipObserver.init(mutations);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        return {
            init: function() {
                loadDefaultAction();
                initObserver();
            }
        };
    });

    // 启动应用
    window.addEventListener('load', function() {
        ModuleSystem.get('controller').init();
    });


})();
