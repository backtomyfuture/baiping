// ==UserScript==
// @name         自动保持页面活跃并点击按钮
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  通过模拟用户活动保持页面活跃，并自动点击按钮，即使页面在后台
// @author       傅强
// @match        http://hnatraining.yunxuetang.cn/kng/plan/document/*
// @match        http://hnatraining.yunxuetang.cn/kng/plan/video/*
// @downloadURL  https://update.greasyfork.org/scripts/479220/%E8%8E%B7%E5%8F%96%E4%BB%B7%E5%B7%AE%E6%95%B0%E6%8D%AE.user.js
// @updateURL    https://update.greasyfork.org/scripts/479220/%E8%8E%B7%E5%8F%96%E4%BB%B7%E5%B7%AE%E6%95%B0%E6%8D%AE.meta.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 覆盖原始的 AppendWarningHtml 函数，不做任何操作
    window.AppendWarningHtml = function() {
        console.log("AppendWarningHtml function called, but it does nothing now.");
    };

    // 启动Web Worker
    const workerBlob = new Blob([`
        setInterval(() => {
            postMessage('keepAlive');
        }, 10000);
    `], { type: 'application/javascript' });

    const worker = new Worker(URL.createObjectURL(workerBlob));
    worker.onmessage = function(event) {
        if (event.data === 'keepAlive') {
            //simulateActivity();
            simulateUserActivity();
        }
    };

    // 模拟用户活动的函数
    function simulateUserActivity() {
        document.dispatchEvent(new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
        document.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
        console.log("模拟用户活动");
    }

    // 点击“继续学习”按钮
    function clickReStartButton() {
        var reStartButton = document.querySelector('#reStartStudy');
        if (reStartButton) {
            reStartButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            reStartButton.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            reStartButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            reStartButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            reStartButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            console.log('“继续学习”按钮已点击并触发事件');
        } else {
            console.log('未找到“继续学习”按钮');
        }
    }

    // 点击“我已学完此知识”按钮
    function clickCompleteStudyButton() {
        var completeStudyButton = document.querySelector('#spanCmp input[type="button"]') || document.querySelector('#divStartArea input[type="button"]');
        if (completeStudyButton) {
            completeStudyButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            completeStudyButton.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            completeStudyButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            completeStudyButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            completeStudyButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            console.log('“我已学完此知识”按钮已点击并触发事件');
        } else {
            console.log('未找到“我已学完此知识”按钮');
        }
    }

    // 保持计时器运行的方法
    function keepTimerRunning() {
        try {
            if (typeof commonHelper !== 'undefined' && typeof commonHelper.startTimer === 'function') {
                commonHelper.startTimer();
                console.log('计时器已保持运行');
            } else if (typeof videoStudy !== 'undefined' && typeof videoStudy.startTimer === 'function') {
                videoStudy.startTimer();
                console.log('视频计时器已保持运行');
            } else if (typeof docStudy !== 'undefined' && typeof docStudy.startTimer === 'function') {
                docStudy.startTimer();
                console.log('文档计时器已保持运行');
            } else {
                console.log('未找到合适的计时器方法');
            }
        } catch (e) {
            console.error('保持计时器运行时出错:', e);
        }
    }

    // 创建一个MutationObserver实例来监测DOM变化
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                clickReStartButton();
                clickCompleteStudyButton();
                keepTimerRunning();
            }
        });
    });

    // 配置观察选项
    var config = { childList: true, subtree: true };

    // 启动观察器，监测整个文档
    observer.observe(document.body, config);

    // 立即检查一次是否有“继续学习”按钮
    clickReStartButton();

    // 立即检查一次是否有“我已学完此知识”按钮
    clickCompleteStudyButton();

    // 立即保持计时器运行
    keepTimerRunning();
})();