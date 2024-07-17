// ==UserScript==
// @name         获取价差数据并显示在航班状态栏
// @namespace    http://tampermonkey.net/
// @version      2.3.3
// @description  监控页面元素的变化并抓取价差数据，然后显示在航班的悬浮菜单中
// @author       傅强
// @match        http://sfm.hnair.net/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @downloadURL  https://update.greasyfork.org/scripts/479220/%E8%8E%B7%E5%8F%96%E4%BB%B7%E5%B7%AE%E6%95%B0%E6%8D%AE%E5%B9%B6%E6%98%BE%E7%A4%BA%E5%9C%A8%E8%88%AA%E7%8F%AD%E7%8A%B6%E6%80%81%E6%A0%8F.user.js
// @updateURL    https://update.greasyfork.org/scripts/479220/%E8%8E%B7%E5%8F%96%E4%BB%B7%E5%B7%AE%E6%95%B0%E6%8D%AE%E5%B9%B6%E6%98%BE%E7%A4%BA%E5%9C%A8%E8%88%AA%E7%8F%AD%E7%8A%B6%E6%80%81%E6%A0%8F.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const DEBOUNCE_DELAY = 300; // 300ms delay for debounce
    const REQUEST_TIMEOUT = 300000; // 5 minutes timeout
    let debounceTimer = null; // Debounce timer
    const requestCache = new Map();

    const cityMap = {
        'PEK': 'BJS', 'PKX': 'BJS', 'TFU': 'CTU', 'XIY': 'SIA'
    };

    // Fetch and cache HTTP requests
    async function GM_xmlhttpRequestAsync(options) {
        const cacheKey = JSON.stringify(options);
        if (requestCache.has(cacheKey)) {
            const { data, timestamp } = requestCache.get(cacheKey);
            if (Date.now() - timestamp < REQUEST_TIMEOUT) return data;
            requestCache.delete(cacheKey); // 清除过期缓存
        }
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...options,
                onload: (response) => {
                    const data = JSON.parse(response.responseText);
                    requestCache.set(cacheKey, { data, timestamp: Date.now() });
                    resolve(data);
                },
                onerror: reject
            });
        });
    }


    // Standardize city codes
    function standardizeCityCode(code) {
        return cityMap[code.toUpperCase()] || code.toUpperCase();
    }

    // Fetch paginated data
    async function fetchPaginatedData(url, headers) {
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
        try {
            const data = await fetchPaginatedData(url, headers);
            console.log("Fetched Data:", data); // 打印返回的数据以进行调试
            return data;
        } catch (error) {
            console.error("Error fetching additional data:", error); // 打印错误信息以进行调试
            return [];
        }
    }


    // Handle specific element found and fetch data
    async function handleSpecificElementFound() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const { token: authorizationToken, airCompony } = userInfo;
                const xsrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '';

                const cityCodeText = getCityCodeText();
                if (!cityCodeText) return;

                const depCityCode = cityCodeText.substring(0, 3).toUpperCase();
                const arrCityCode = cityCodeText.substring(3, 6).toUpperCase();

                const allData = await fetchAllData(depCityCode, arrCityCode, airCompony, authorizationToken, xsrfToken);
                sessionStorage.setItem('fetchedData', JSON.stringify(allData));
                console.log('已经获取了新的价差数据', allData);

                // Get flight start and end dates
                const startFltDate = document.querySelector('input[placeholder="开始日期"]').value;
                const endFltDate = document.querySelector('input[placeholder="结束日期"]').value;

                const params = {
                    limit: 20,
                    jobId: 'job_18992',
                    status: '',
                    dataSource: 'clickHouse',
                    startCmdTime: '2024-07-15 00:00:00',
                    endCmdTime: '2024-07-15 23:59:59',
                    isCmd: '',
                    jobWarningType: ''
                };

                const additionalData = await fetchAdditionalData(params, authorizationToken, depCityCode, arrCityCode, startFltDate, endFltDate);
                sessionStorage.setItem('additionalData', JSON.stringify(additionalData));
                console.log('已经获取了历史航线平均价格数据:', additionalData);

            } catch (error) {
                console.error('发生错误：', error);
            }
        }, DEBOUNCE_DELAY);
    }


    // Get city code text from the DOM
    function getCityCodeText() {
        const label = document.querySelector('label[title="航段"]');
        if (label) {
            const parent = label.parentElement;
            const siblings = Array.from(parent.parentNode.children).filter(child => child !== parent);
            const firstElement = siblings.find(sibling => sibling.querySelector('.ant-select-selection-item'));
            return firstElement ? firstElement.textContent : document.querySelector("#basic_segs")?.value || document.querySelector('input[id*="segs"]')?.value;
        }
        return '';
    }

    // Start observing a target node for changes
    function startObserving(targetNode) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length === 0) continue;

                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const targetElement = node.querySelector('.ant-spin-sm > div:nth-child(2) > span');
                    if (targetElement && targetElement.innerText === "加载实时数据") {
                        handleSpecificElementFound();
                        observer.disconnect();
                        return;
                    }
                }
            }
        });

        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Global observer for initializing specific element observer
    const globalObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length === 0) continue;

            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;

                const parentElement = node.closest('div.art-table > div.art-table-header.no-scrollbar > table');
                if (parentElement) {
                    console.log("找到父Table元素");
                    startObserving(parentElement);
                    return;
                }
            }
        }
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });

    // Utility functions for date comparison
    const dateDiffInDays = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));
    const createPureDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Update tooltip content with fetched data
    const updateTooltipContent = async (tooltipElement, targetElement) => {
        if (tooltipElement.getAttribute('data-modified')) return;

        const fetchedData = JSON.parse(sessionStorage.getItem('fetchedData') || 'null');
        const additionalData = JSON.parse(sessionStorage.getItem('additionalData') || 'null');
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const { airCompony } = userInfo;

        if (!fetchedData && !additionalData) {
            console.log('No fetchedData or additionalData');
            return;
        }

        const idParts = targetElement.id.split('-');
        const targetDate = new Date(idParts[1], idParts[2] - 1, idParts[3]);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const flightsData = {};
        let additionalContent = '';

        const processAdditionalData = () => {
            additionalData.forEach(item => {
                const itemFltDate = new Date(item.fltDate);
                itemFltDate.setHours(0, 0, 0, 0);
                if (item.fltNo === idParts[4] && itemFltDate.getTime() === targetDate.getTime()) {
                    if (!flightsData[item.fltNo]) flightsData[item.fltNo] = [];
                    const remark = JSON.parse(item.remark || '{}');

                    let firstPart = '';
                    let secondPart = '';
                    const thirdPart = '<div style="color: red; text-align: center;">预估票价仅供参考</div>';
                    const horizontalLine = '<hr style="border: none; border-top: 1px solid white;">';

                    // 第一部分的逻辑
                    if (remark["同期航班销售情况"] && remark["机型"] && remark["时刻"]) {
                        firstPart = `<div>历史同期: </div>
                             <div>机型:${remark["机型"]}</div>
                             <div>时刻:${remark["时刻"]}</div>
                             <div>销售:${remark["同期航班销售情况"]}</div>`;
                    } else if (remark["同期航段均价"]) {
                        firstPart = `<div>历史同期: </div>
                             <div>航段均价: ${remark["同期航段均价"]}</div>`;
                    }

                    // 第二部分的逻辑
                    if (remark["预估月均票价"]) {
                        secondPart = `<div>预估月均票价: ${remark["预估月均票价"]}</div>`;
                    }

                    // 按需求组合展示内容
                    if (firstPart) {
                        additionalContent += `${horizontalLine}${firstPart}${horizontalLine}${secondPart}${horizontalLine}${thirdPart}`;
                    } else if (secondPart) {
                        additionalContent += `${horizontalLine}${secondPart}${horizontalLine}${thirdPart}`;
                    }
                }
            });
        };

        const processFetchedData = () => {
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
        };

        if (idParts[4].includes(airCompony) || (airCompony === "HU" && idParts[4].includes("CN"))) {
            if (additionalData) processAdditionalData();
        } else {
            if (fetchedData) processFetchedData();
            for (const [fltNo, values] of Object.entries(flightsData)) {
                additionalContent += `<div>${fltNo}</div><div>${values.join('<br>')}</div>`;
            }
        }

        tooltipElement.innerHTML += additionalContent;
        tooltipElement.setAttribute('data-modified', 'true');
    };



    let currentHoveredElement = null;

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function onElementHover(event) {
        currentHoveredElement = null;
        const target = event.target;
        if (target && target.id && target.id.startsWith('data-')) {
            currentHoveredElement = target;
        }
    }

    const attachListenersToTargets = debounce(() => {
        const tableCells = document.querySelectorAll('.art-table-cell');
        tableCells.forEach(element => {
            element.removeEventListener('mouseover', onElementHover);
            element.addEventListener('mouseover', onElementHover);
        });
    }, 300);

    const elementObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                attachListenersToTargets();
            }
        });
    });

    elementObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

    const tooltipObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 查找新添加的 ant-tooltip 元素
                        const tooltipElement = node.querySelector('.ant-tooltip');
                        if (tooltipElement && !tooltipElement.classList.contains('ant-tooltip-hidden')) {
                            // 找到 ant-tooltip-inner 元素
                            const tooltipInner = tooltipElement.querySelector('.ant-tooltip-inner');
                            if (tooltipInner && !tooltipInner.getAttribute('data-modified')) {
                                // 使用位置来查找对应的目标元素
                                const targetElement = currentHoveredElement;
                                console.log("targetElement:", targetElement);
                                if (targetElement && targetElement.id && targetElement.id.startsWith('data-')) {
                                    updateTooltipContent(tooltipInner, targetElement);
                                }
                            }
                        }
                    }
                });
            }
        });
    });

    tooltipObserver.observe(document.body, { childList: true, subtree: true });


})();
