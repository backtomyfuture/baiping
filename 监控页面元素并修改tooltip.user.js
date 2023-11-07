// ==UserScript==
// @name         监控页面元素并修改tooltip
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  根据价差数据进行匹配，然后修改tooltip
// @author       傅强
// @match        http://sfm.hnair.net/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

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