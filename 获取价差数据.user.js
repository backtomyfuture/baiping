// ==UserScript==
// @name         获取价差数据
// @namespace    http://tampermonkey.net/
// @version      1.3
// @downloadURL http://www.tianjinairlines.cn:5000/sharing/vWgkxlsBy
// @updateURL   http://www.tianjinairlines.cn:5000/sharing/vWgkxlsBy
// @description  监控页面元素的变化并抓取价差数据
// @author       傅强
// @match        http://sfm.hnair.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let debounceTimer = null;
    const DEBOUNCE_DELAY = 300; // 200ms delay for debounce

    const requestCache = new Map();
    // 定义 GM_xmlhttpRequestAsync
    async function GM_xmlhttpRequestAsync(options, timeout = 300000) {
        const cacheKey = JSON.stringify(options);
        if (requestCache.has(cacheKey)) {
            const { data, timestamp } = requestCache.get(cacheKey);
            if (Date.now() - timestamp < timeout) return data;
        }
        const response = await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                ...options,
                onload: resolve,
                onerror: reject
            });
        });
        requestCache.set(cacheKey, { data: response, timestamp: Date.now() });
        return response;
    }

    async function fetchAllData(depCityCode, arrCityCode, airCompony, authorizationToken, xsrfToken) {

        // 替换逻辑
        if (depCityCode === 'PEK' || depCityCode === 'PKX') {
            depCityCode = 'BJS';
        }
        if (arrCityCode === 'PEK' || arrCityCode === 'PKX') {
            arrCityCode = 'BJS';
        }
        if (depCityCode === 'TFU') {
            depCityCode = 'CTU';
        }
        if (arrCityCode === 'TFU') {
            arrCityCode = 'CTU';
        }
        if (depCityCode === 'XIY') {
            depCityCode = 'SIA';
        }
        if (arrCityCode === 'XIY') {
            arrCityCode = 'SIA';
        }

        let page = 1;
        let allData = [];

        while (true) {
            const url = `http://sfm.hnair.net/sfm-admin/priceCheck/rule/list?page=${page}&limit=50&depCityCode=${depCityCode}&arrCityCode=${arrCityCode}&airline=${airCompony}`;
            const response = await GM_xmlhttpRequestAsync({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'X-Authorization': authorizationToken,
                    'X-Xsrf-Token': xsrfToken
                }
            });

            const data = JSON.parse(response.responseText).obj.list;
            if (data.length === 0) {
                break; // 如果没有更多数据，退出循环
            }

            allData = allData.concat(data); // 添加新获取的数据到总数据数组中
            page++; // 增加页数以获取下一批数据
        }

        return allData;
    }

    // 新功能：只针对特定样式和内容的span元素清除颜色
    const clearSpecificSpanStyles = () => {
        const spans = document.querySelectorAll('span[style*="color: red; font-weight: bolder;"]');
        console.log("找到红色元素", spans);
        spans.forEach(span => {
            if (span.textContent.trim() === "C") {
                span.style.color = ''; // 移除颜色
                span.style.fontWeight = ''; // 移除加粗
            }
        });
    };

    // 新的 MutationObserver 监听DOM变化并清除样式
    const observer = new MutationObserver((mutations, obs) => {
        const spans = document.querySelectorAll('span[style*="color: red; font-weight: bolder;"]');
        if (spans.length > 0) {
            clearSpecificSpanStyles();
            // 如果需要持续监控可以不断开观察者，否则可以在找到元素后断开
            // obs.disconnect();
        }
    });

    // 启动观察者以监视整个文档的变化
    observer.observe(document, { childList: true, subtree: true });

    async function handleSpecificElementFound() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            console.log("找到特定元素");

            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                const { token: authorizationToken, airCompony } = userInfo;
                const xsrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) || [])[1] || '';

                //const cityCodeText = document.querySelector("#basic > div:nth-child(5) > div > div > div.ant-col.ant-col-16.ant-form-item-control > div > div > div > div > span.ant-select-selection-item").textContent;

                let cityCodeText = '';

                // 尝试获取第一个选择器的元素
                console.log('开始定位子元素')
                //const firstElement = document.querySelector("#basic > div:nth-child(5) > div > div > div.ant-col.ant-col-16.ant-form-item-control > div > div > div > div > span.ant-select-selection-item");
                const label = document.querySelector('label[title="航段"]');
                console.log('已经获取了航段', label)
                const parent = label.parentElement;
                console.log('已经获取了航段的父亲', parent)
                const siblings = Array.from(parent.parentNode.children).filter(child => child !== parent);
                console.log('已经获取了航段的父亲的兄弟元素', siblings)
                const firstElement = siblings.find(sibling => sibling.querySelector('.ant-select-selection-item'));
                console.log('已经获取了目标元素', firstElement)



                if (firstElement) {
                    cityCodeText = firstElement.textContent;
                } else {
                    // 如果第一个选择器没有找到元素，尝试获取第二个选择器的元素
                    const secondElement = document.querySelector("#basic_segs");
                    if (secondElement) {
                        cityCodeText = secondElement.value;
                    }
                }

                const depCityCode = cityCodeText.substring(0, 3);
                const arrCityCode = cityCodeText.substring(3, 6);

                const allData = await fetchAllData(depCityCode, arrCityCode, airCompony, authorizationToken, xsrfToken);
                sessionStorage.setItem('fetchedData', JSON.stringify(allData));
                console.log('已经获取了新的数据', allData)

            } catch (error) {
                console.error('发生错误：', error);
            }

        }, DEBOUNCE_DELAY);
    }


    function startObserving(targetNode) {
        const childObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length === 0) continue;

                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const targetElement = node.querySelector('.ant-spin-sm > div:nth-child(2) > span');
                    if (targetElement && targetElement.innerText === "加载实时数据") {
                        handleSpecificElementFound();
                        childObserver.disconnect(); // 新增这行
                        return; // Early exit
                    }
                }
            }
        });

        childObserver.observe(targetNode, { childList: true, subtree: true });
    }

    const globalObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length === 0) continue;

            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;

                const parentElement = node.closest('div.art-table > div.art-table-header.no-scrollbar > table');
                if (parentElement) {
                    console.log("找到父Table元素");
                    startObserving(parentElement);
                    return; // Early exit
                }
            }
        }
    });

    globalObserver.observe(document.body, { childList: true, subtree: true });



    // 计算两个日期之间的天数差异
    const dateDiffInDays = (a, b) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.floor((a - b) / msPerDay);
    };

    // 创建一个纯日期对象，不包括时间
    const createPureDate = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const modifyTooltipContent = async (event) => {
        const fetchedData = JSON.parse(sessionStorage.getItem('fetchedData') || 'null');
        console.log('Fetched Data:', fetchedData); // Debug
        if (!fetchedData) return;

        const updatePromise = new Promise(resolve => {
            setTimeout(() => {
                const tooltipElements = document.querySelectorAll('div.ant-tooltip-inner');
                let lastElement = tooltipElements[tooltipElements.length - 1];
                console.log('目标元素:', event.target); // Debug

                if (!lastElement || lastElement.getAttribute('data-modified')) return;

                const idParts = event.target.id.split('-');
                const targetDate = new Date(idParts[1], idParts[2] - 1, idParts[3]);
                const today = new Date();

                targetDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                console.log('Target Date:', targetDate); // Debug
                console.log('Today:', today); // Debug

                let flightsData = new Map();

                fetchedData.forEach(entry => {
                    console.log('Entry:', entry); // Debug

                    const daysDifference = dateDiffInDays(targetDate, today); // 计算天数差异
                    console.log('Days Difference:', daysDifference); // Debug

                    const pureEffectiveDateStart = createPureDate(new Date(entry.effectiveDateStart));
                    const pureEffectiveDateEnd = createPureDate(new Date(entry.effectiveDateEnd));
                    const pureTargetDate = createPureDate(targetDate);

                    const matchesFltNo = entry.compFltNo.includes(idParts[4]);
                    const isWithinDate = pureEffectiveDateStart <= pureTargetDate && pureEffectiveDateEnd >= pureTargetDate;
                    const isWithinDcp = daysDifference >= entry.startDcp && daysDifference <= entry.endDcp;
                    const isWithinDow = entry.carryDow.includes(targetDate.getDay() + 1);

                    console.log('Matches Flight Number:', matchesFltNo); // Debug
                    console.log('Is Within Date:', isWithinDate); // Debug
                    console.log('Is Within DCP:', isWithinDcp); // Debug
                    console.log('Is Within DOW:', isWithinDow); // Debug

                    if (matchesFltNo && isWithinDate && isWithinDcp && isWithinDow) {
                        if (!flightsData[entry.fltNo]) {
                            flightsData[entry.fltNo] = [];
                        }
                        flightsData[entry.fltNo].push(entry.bigCabin + '价差：' + entry.priceDiffStd);
                    }
                });

                console.log('Flights Data:', flightsData); // Debug

                let additionalContent = '';
                for (const [fltNo, values] of Object.entries(flightsData)) {
                    additionalContent += `\n${fltNo}\n${values.join('\n')}`;
                }

                console.log('Additional Content:', additionalContent); // Debug
                lastElement.innerText += additionalContent;
                lastElement.setAttribute('data-modified', 'true');
                resolve();
            }, 500);
        });
        await updatePromise;
    };

    const attachListenersToTargets = () => {
        const targetElements = document.querySelectorAll('[id^="data-"]');
        targetElements.forEach(element => {
            element.removeEventListener('mouseover', modifyTooltipContent);
            element.addEventListener('mouseover', modifyTooltipContent);
        });
    };

    const tooltipObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                attachListenersToTargets();
            }
        });
    });

    tooltipObserver.observe(document.body, { attributes: true, childList: true, subtree: true });


})();