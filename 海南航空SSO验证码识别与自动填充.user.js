// ==UserScript==
// @name         海南航空SSO验证码识别与自动填充
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  使用Tesseract.js识别海南航空SSO登录页面的纯数字验证码并自动填充
// @match        https://sso.hnair.net/login*
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('验证码识别脚本已加载');

    // 使用Tesseract.js识别验证码（仅数字）
    async function recognizeCaptcha(imageElement) {
        try {
            console.log('开始识别验证码');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;

            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');

            console.log('验证码图片已处理，开始OCR识别');
            const worker = await Tesseract.createWorker('eng');
            // 设置Tesseract只识别数字
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789'
            });
            const { data: { text } } = await worker.recognize(dataUrl);
            await worker.terminate();

            const cleanedText = text.replace(/\D/g, ''); // 只保留数字
            console.log('验证码识别结果:', cleanedText);
            return cleanedText;
        } catch (error) {
            console.error('验证码识别失败：', error);
            throw error;
        }
    }

    // 主要功能
    async function fillCaptcha() {
        console.log('开始执行fillCaptcha函数');
        const captchaImg = document.querySelector('#code');
        const captchaInput = document.querySelector('#rand');

        if (captchaImg && captchaInput) {
            console.log('找到验证码图片和输入框');
            // 检查输入框是否已经有内容
            if (captchaInput.value.trim() !== '') {
                console.log('验证码输入框已有内容，不再执行识别');
                return;
            }
            try {
                if (!captchaImg.complete) {
                    console.log('验证码图片未加载完成，等待加载');
                    await new Promise(resolve => captchaImg.onload = resolve);
                }

                const captchaText = await recognizeCaptcha(captchaImg);
                captchaInput.value = captchaText;
                console.log('验证码已自动填充：', captchaText);

                // 触发input事件，以防网站有监听
                captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (error) {
                console.error('验证码自动填充失败：', error);
            }
        } else {
            console.log('未找到验证码图片或输入框');
        }
    }

    // 当DOM内容加载完成时执行fillCaptcha函数
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM内容已加载，准备执行fillCaptcha');
        setTimeout(fillCaptcha, 100); // 延迟1秒执行，确保所有元素都已加载
    });

    // 监听验证码图片的点击事件，在点击后重新识别
    document.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'code') {
            console.log('验证码图片被点击，准备重新识别');
            setTimeout(fillCaptcha, 1000); // 延迟1秒执行，等待新验证码加载
        }
    });

    window.addEventListener('load', () => {
        const captchaInput = document.querySelector('#rand');
        if (captchaInput && captchaInput.value.trim() === '') {
            console.log('验证码输入框为空，尝试填充');
            fillCaptcha();
        } else {
            console.log('验证码输入框已有内容，跳过填充');
        }
    });

})();
