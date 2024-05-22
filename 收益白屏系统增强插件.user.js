// ==UserScript==
// @name         收益白屏系统增强插件
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  移动#refresh按钮并移除特定的重置按钮;新增右击菜单，可以更方便点击发送指令和发起调价；新增批量提交政策功能
// @author       傅强
// @match        http://sfm.hnair.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 全局存储对象
    var dataStorage = {
        initialValues: {
            firstCell: '',
            secondCell: '',
            tabPane: ''
        },
        updates: [] // { carrier, origin, destination, flight, cabin, salesPrice, startDate, endDate }
    };

    function fetchInitialCellValues() {
        const tableBody = document.querySelector('.ant-spin-container .ant-table-content .ant-table-tbody');
        if (tableBody) {
            const cells = tableBody.querySelectorAll('.ant-table-row.ant-table-row-level-0 .ant-table-cell');
            if (cells.length >= 2) {
                dataStorage.initialValues.firstCell = cells[0].textContent.trim();
                dataStorage.initialValues.secondCell = cells[1].textContent.trim();
                console.log('第一个单元格的内容:', dataStorage.initialValues.firstCell);
                console.log('第二个单元格的内容:', dataStorage.initialValues.secondCell);
            }
        }

        const tabPanes = document.querySelectorAll('.tabpane-div');
        tabPanes.forEach(tabPane => {
            const parentDiv = tabPane.closest('div[role="tab"]');
            if (parentDiv && parentDiv.getAttribute('aria-disabled') === 'true') {
                dataStorage.initialValues.tabPane = tabPane.textContent.trim();
                console.log('符合条件的TabPane的内容:', dataStorage.initialValues.tabPane);
            }
        });
    }

    function addBatchButton() {
        const targetModal = document.querySelector('.react-draggable .ant-modal-content');
        if (!targetModal) return;

        const container = targetModal.querySelector('.ant-row[style*="justify-content: flex-end;"]');
        if (!container) return;

        // 检查是否已经添加了按钮，避免重复添加
        if (container.querySelector('.batch-add-button')) return;

        const batchButton = document.createElement('button');
        batchButton.type = 'button';
        batchButton.className = 'ant-btn ant-btn-primary batch-add-button'; // 增加自定义类名以便后续查找
        batchButton.style.marginRight = '20px';
        batchButton.innerHTML = '<span>批量添加</span>';

        batchButton.addEventListener('click', async () => {

            // 设置<textarea>的内容
            const applyReasonTextarea = targetModal.querySelector('#basic_applyReason');
            if (applyReasonTextarea) {
                // 创建一个 native input value setter，这次使用 HTMLTextAreaElement
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                // 创建一个 input 事件
                const inputEvent = new Event('input', { bubbles: true });
                nativeInputValueSetter.call(applyReasonTextarea, '跟进CA、CZ、MU');
                // 触发事件
                applyReasonTextarea.dispatchEvent(inputEvent);
                console.log('已经设置输入框的默认文本');
            } else {
                console.error('未找到指定的<textarea>');
            }


            // 获取表格的tbody
            const tableBody = targetModal.querySelector('.ant-table-tbody');
            if (!tableBody) {
                console.error('未找到表格的tbody');
                return;
            }

            // 移除 .ant-table-placeholder 元素
            const placeholder = tableBody.querySelector('.ant-table-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            // 获取 dataStorage 中存储的数据
            const updates = dataStorage.updates;
            if (updates.length === 0) {
                console.warn('dataStorage 中没有存储的数据');
                return;
            }

            // 获取表格的第一行
            const firstRowCheckbox = tableBody.querySelector('.ant-table-row.ant-table-row-level-0 .ant-table-cell.ant-table-selection-column input[type="checkbox"]');
            if (!firstRowCheckbox) {
                console.error('未找到表格的第一行');
                return;
            }

            // 模拟点击第一行的复选框
            firstRowCheckbox.click();

            // 获取 "复制添加" 按钮
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
                // 点击“复制添加”按钮
                copyAddButton.click();

                // 等待新行被添加
                await new Promise(resolve => setTimeout(resolve, 100)); // 调整延迟时间确保新行被添加

                // 获取新添加的行（假设新行添加到表格的最后）
                const newRow = tableBody.querySelector('.ant-table-row.ant-table-row-level-0:last-child');

                // 更新新行内容
                const cells = newRow.querySelectorAll('.ant-table-cell');
                //updateCell(cells[2], update.carrier); // 承运人
                console.log("始发地的值",update.origin)
                await updateCell(cells[3], update.origin); // 始发地
                await updateCell(cells[4], update.destination); // 目的地
                await updateCell(cells[5], update.flight); // 航班
                await updateCell(cells[7], update.cabin); // 舱位
                await updateCell(cells[8], update.salesPrice); // 销售价格
                await updateCell(cells[9], update.startDate); // 航班开始日期
                await updateCell(cells[10], update.endDate); // 航班结束日期

                // 清除新行的checkbox选中状态
                const newRowCheckbox = newRow.querySelector('.ant-table-cell.ant-table-selection-column input[type="checkbox"]');
                if (newRowCheckbox) {
                    newRowCheckbox.checked = false;
                    newRowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            console.log(`添加了 ${updates.length} 行到表格中`);

            // 清空 dataStorage.updates
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

        // 模拟双击事件
        const dblClickEvent = new MouseEvent('dblclick', { bubbles: true });
        editableDiv.dispatchEvent(dblClickEvent);

        await new Promise(resolve => setTimeout(resolve, 100));

        const input = cell.querySelector('input, textarea, [contenteditable="true"]');
        if (input) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(input, newValue);

            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);
        }
    }

    function moveButton() {
        const refreshButton = document.querySelector('#refresh');
        const container = document.querySelector('.ant-col-9 .ant-row.ant-form-item-row .ant-form-item-control-input .ant-space');
        if (refreshButton && container && refreshButton.parentNode !== container) {
            container.appendChild(refreshButton);
        }
    }

    function removeButton() {
        const buttons = document.querySelectorAll('button.ant-btn.ant-btn-default');
        buttons.forEach(button => {
            if (button.className === 'ant-btn ant-btn-default' && button.textContent.trim() === '重 置') {
                button.remove();
            }
        });
    }

    function addCustomContextMenu() {
        const targetElement = document.querySelector('#cabin-control-id');
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

    function addDoubleClickHandler() {
        const targetElement = document.querySelector('#cabin-control-id .ant-table-tbody');
        if (!targetElement || targetElement.dataset.doubleClickAdded) return;

        console.log('已经开启了右侧容器');
        targetElement.dataset.doubleClickAdded = 'true'; // 避免重复绑定

        const rows = targetElement.querySelectorAll('.ant-table-row.ant-table-row-level-0');
        console.log('找到所有行项目：', rows);

        if (rows.length > 0) {
            fetchInitialCellValues(); // 获取初始单元格值和TabPane值
        }

        rows.forEach(row => {
            const firstCell = row.querySelector('.ant-table-cell:nth-child(1)');
            if (firstCell) {
                firstCell.dataset.oldValue = firstCell.textContent.trim(); // 存储原始值
                firstCell.addEventListener('dblclick', function() {
                    makeCellEditable(firstCell);
                });
                console.log('[双击监控] 绑定双击事件至单元格');
            }
        });
    }

    function makeCellEditable(cell) {
        const currentText = cell.textContent.trim();
        cell.dataset.oldValue = currentText; // 在这里存储原始值
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.style.width = "100%";
        cell.innerHTML = ''; // 清空单元格内容
        cell.appendChild(input); // 添加输入框
        input.focus(); // 自动聚焦输入框

        input.addEventListener('blur', function() {
            const newValue = input.value.trim();
            if (newValue !== currentText) {
                updateCellValue(cell, newValue);
            }
            cell.textContent = newValue; // 更新单元格文本，无论内容是否更改都恢复原样
        });
        input.addEventListener('keydown', function(event) {
            if (event.key === "Enter") {
                input.blur(); // 触发 blur 事件保存数据
            }
        });
    }



    function updateCellValue(cell, newValue) {
        const oldValue = cell.dataset.oldValue || '';
        const tabPaneValue = dataStorage.initialValues.tabPane;
        const firstCellValue = dataStorage.initialValues.firstCell;
        const secondCellValue = dataStorage.initialValues.secondCell;

        // 提取和存储指定格式的值
        const updateRecord = {
            carrier: firstCellValue.substring(0, 2), // 承运人
            origin: tabPaneValue.substring(0, 3), // 始发地
            destination: tabPaneValue.substring(3, 6), // 目的地
            flight: firstCellValue, // 航班
            cabin: oldValue, // 舱位
            salesPrice: newValue.replace(/\D/g, ''), // 销售价格，仅取数字部分
            startDate: secondCellValue, // 航班开始日期
            endDate: secondCellValue // 航班结束日期
        };

        console.log(`[数据更新] 更新记录:`, updateRecord);
        dataStorage.updates.push(updateRecord);
        cell.textContent = newValue; // 更新单元格文本
    }



    function createContextMenu(x, y) {

        // 创建样式元素并添加到文档头部
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

        // 创建"发送指令"菜单项
        const sendItem = document.createElement('div');
        sendItem.className = 'custom-context-menu-item';
        sendItem.textContent = '发送指令';
        sendItem.addEventListener('click', () => {
            const button = Array.from(document.querySelectorAll('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发送指令'));
            if (button) {
                button.click();
            }
            menu.remove();
        });

        // 创建"调价"菜单项
        const priceAdjustmentItem = document.createElement('div');
        priceAdjustmentItem.className = 'custom-context-menu-item';
        priceAdjustmentItem.textContent = '发起调价';
        priceAdjustmentItem.addEventListener('click', () => {
            const button = Array.from(document.querySelectorAll('button.ant-btn.ant-btn-primary')).find(btn => btn.textContent.includes('发起调价'));
            if (button) {
                button.click();
            }
            menu.remove();
        });

        // 将菜单项添加到菜单中
        menu.appendChild(sendItem);
        menu.appendChild(priceAdjustmentItem);

        return menu;
    }

    function removeCustomMenu() {
        const existingMenu = document.querySelector('div[style*="position: absolute"]');
        if (existingMenu) existingMenu.remove();
    }

    const observer = new MutationObserver((mutations, obs) => {
        moveButton();
        removeButton();
        addCustomContextMenu();
        addDoubleClickHandler();
        addBatchButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        moveButton();
        removeButton();
        addCustomContextMenu();
        addDoubleClickHandler();
        addBatchButton();
    });
})();
