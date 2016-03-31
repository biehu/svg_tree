            
$(function () {
    
    /*
     * svg树
     */
    
    // --- 画图 ---
    
    var wrap = document.getElementById('chart');
    var width = Number(wrap.getAttribute('data-width')) || 800;
    var height = Number(wrap.getAttribute('data-height')) || 350;
    
    var pointColor = '#FFB980';
    var textColor = '#000';
    var lineColor = '#C26D6D';
    
    var childHideColor = '#B6A2DE';
    var hoverColor = '#2EC7C9';
    
    var dataUrl = '/aj/task/gettaskconfig';
    var submitUrl = '/aj/task/addtask';
    
    var imgAddUrl = 'http://img.t.sinajs.cn/t4/appstyle/e_vertical_admin/images/add.png';
    var imgDeleteUrl = 'http://img.t.sinajs.cn/t4/appstyle/e_vertical_admin/images/delete.png';
    
    var oneLineData = [];
    var nowEnd;
    var svgHtmlWrap;
    
    var paper = Raphael(wrap, width, height);
    
    var connect = function (obj1, obj2, line) {
        var bb1 = obj1.getBBox();
        var bb2 = obj2.getBBox();
           
        var path = ["M", bb1.x + bb1.width, bb1.y + bb1.height / 2, 
            "L", bb2.x, bb2.y + bb2.height / 2].join(",");
        
        var color = typeof line == "string" ? line : "#000";
        return {
            line: paper.path(path).attr({stroke: color, fill: "none"}).toBack(),
            from: obj1,
            to: obj2
        };
        
    };
    
    var changeOneLineStyle = function (c, status) {
        var pointSet = paper.set();
        var lineSet = paper.set();
        var selectedLinePointColor, selectedLineColor, nextPoint;
        
        if (status === 'default') {
            selectedLinePointColor = pointColor;
            selectedLineColor = lineColor;
            
            oneLineData = [];
        } else {
            selectedLinePointColor = hoverColor;
            selectedLineColor = hoverColor;
            
            oneLineData.push({'action': c.data('key')});
        }
        
        pointSet.push(c);
        
        while (c && c.data('topId') !== undefined) {
            nextPoint = paper.getById(c.data('topId'));
            
            pointSet.push(nextPoint);
            lineSet.push(paper.getById(c.data('lineId')));
            
            if (status === 'hover') {
                oneLineData.push({'action': nextPoint.data('key')});
                c.data('onNowEndLine', true);
            } else {
                c.data('onNowEndLine', false);
            }
            
            c = nextPoint;
        }
        
        pointSet.attr('fill', selectedLinePointColor);
        lineSet.attr('stroke', selectedLineColor);
        
        setMaySubmit();
    };
    
    var isMayClickShow = function (c) {
        return c.attr('opacity') !== 0 && c.data('nextId');// 有子节点
    };
    
    var toggleShowChildPoint = function (c, status) {
        var childSet = paper.set();
        var lineSet  = paper.set();
        var textSet = paper.set();

        var point, i, opacity, color,
            handleSetFuc;
        
        if (status === 'show') {
            opacity = 1;
            color = pointColor;
            
        } else {
            opacity = 0;
            color = childHideColor;
        }
        
        c.attr('fill', color);
        
        var childs = svgHtmlWrap.find('#' + c.id).find('div');
        for (i = 0; i < childs.length; i++) {
            point = paper.getById(childs[i].id);
            childSet.push(point);
            lineSet.push(paper.getById(point.data('lineId')));
            textSet.push(paper.getById(point.data('textId')));
        }
        
        childSet.attr('opacity', opacity);
        childSet.attr('fill', pointColor);
        childSet.data('isChildHide', false);
        
        lineSet.attr('opacity', opacity);
        lineSet.attr('stroke', lineColor);
        
        
        textSet.attr('opacity', opacity);
    };
    
    var hoverPoint = function (c, status) {
        if (!isMayClickShow(c)) return;
        
        if (status === 'hover') {
            c.attr('opacity', .5);
            
            paper.getById(c.data('textId')).hide();
            
            paper.getById(c.data('addTextId')).hide();
            paper.getById(c.data('deleteTextId')).hide();
                
            if (c.data('isChildHide')) {
                paper.getById(c.data('addTextId')).show();
            } else {
                paper.getById(c.data('deleteTextId')).show();
            }
            
        } else {
            
            c.attr('opacity', 1);
            
            paper.getById(c.data('textId')).show();
            
            paper.getById(c.data('addTextId')).hide();
            paper.getById(c.data('deleteTextId')).hide();
            
        }
        
    };
    
    var changeLine = function (text, len) {
        var textArr = text.split('');
        var i;
        for (i = 1; i < textArr.length; i++) {
            if (i % len === 0) textArr.splice(i, 0, '\n');
        }
        return textArr.join('');
    };
    
    var averageDis = function (dis, len) {
        return len === 1 ? 0 : (dis - len * (2 * r)) / (len - 1);
    };
    
    var getR = function (data) {
        var r = 40;
        var max = 0;
        var lastR = r;
        var i, ii;
        
        for (i = 0, ii = data.length; i < ii; i++) {
            max = Math.max(max, data[i].length);
        }
        
        if (max * 2 * r > height) {
            r = r - (max * 2 * r - height) / max;
        }
        
        if (r < 25) r = 25;

		console.log(r);
        
        return r;
    };
    
    var init = function (data) {
        svgHtmlWrap = $('<div id="svg_html_wrap"></div>').hide().appendTo('body');
        
        var dx, dy, item, i, j, k,
            circle, lineConn,
            text, addText, deleteText,
            pointTextSet;
    
        r = getR(data);
        xdis = averageDis(width, data.length > 4 ? data.length : 4);
        
        for (i = 0, ii = data.length; i < ii; i++) {
            dx = r + (r * 2 + xdis) * i;
            ydis = averageDis(height, data[i].length);
            
            for (j = 0, jj = data[i].length; j < jj; j++) {
                dy = r + (r * 2 + ydis) * j;
                
                item = data[i][j];
                
                circle = paper.circle(dx, dy, r).attr({stroke: 'none', fill: pointColor});
                item.elem = circle;
                
                text = paper.text(dx, dy, changeLine(item.text, 4)).attr({fill: textColor});
                addText = paper.image(imgAddUrl, dx - 10, dy - 11, 20, 22).hide();
                deleteText = paper.image(imgDeleteUrl,dx - 10, dy - 11, 20, 22).hide();
        
                circle.data('dataid', item.id);
                circle.data('key', item.key);
                circle.data('textId', text.id);
                circle.data('addTextId', addText.id);
                circle.data('deleteTextId', deleteText.id);
                
                if (i === 0) {
                    svgHtmlWrap.append('<div id="' + circle.id + '"></div>');
                }
                
                paper.forEach(function (el) {
                    if (el.data('dataid') === item.to) {
                        lineConn = connect(el, circle, lineColor);
                        circle.data('topId', el.id);
                        circle.data('lineId', lineConn.line.id);
                        
                        if (!el.data('nextId')) {
                            el.data('nextId', circle.id + '');
                        } else {
                            el.data('nextId', el.data('nextId') + ',' + circle.id);
                        }
                        
                        svgHtmlWrap.find('#' + el.id).append('<div id="' + circle.id + '"></div>');
                    }
                });
                
        		pointTextSet = paper.set();
                pointTextSet.push(circle, text, addText, deleteText);
                
                pointTextSet.attr({cursor: 'pointer'});
                
        		(function (pointTextSet) {
                    
                    pointTextSet.hover(function () {
                        hoverPoint(pointTextSet[0], 'hover');
                    }, function () {
                        hoverPoint(pointTextSet[0], 'out');
                    });
                
        			pointTextSet.click(function () {
        				var c = pointTextSet[0];
        				
        				if (!c.data('nextId')) {// 选中
        					if (nowEnd) changeOneLineStyle(nowEnd, 'default');
        					changeOneLineStyle(c, 'hover');
        					nowEnd = c;
        				} else {// 折叠
        					
        					if (c.data('onNowEndLine')) changeOneLineStyle(nowEnd, 'default');
        						
        					if (c.data('isChildHide')) {
        						toggleShowChildPoint(c, 'show');
        						c.data('isChildHide', false);
                                
        					} else {
        						toggleShowChildPoint(c, 'hide');
        						c.data('isChildHide', true);
                                
        					}
                            
                            hoverPoint(pointTextSet[0], 'hover');// 按钮鼠标换过样式立即变化
        					
        				}
        			});
        
        		})(pointTextSet);
                
            }
            
        }
        
    };
    
    var clearPaper = function () {
        paper.clear();
        nowEnd = null;
        oneLineData = [];
        svgHtmlWrap.remove();
    };
    
    
    

init([[{
    "id": 1,
    "key": 1,
    "to": 0,
    "text": "uid"
}], [{
    "id": 2,
    "key": 3,
    "to": 1,
    "text": "\u7528\u6237\u4fe1\u606f"
},
{
    "id": 3,
    "key": 4,
    "to": 1,
    "text": "\u7c89\u4e1d\u5217\u8868"
},
{
    "id": 4,
    "key": 5,
    "to": 1,
    "text": "\u53d1\u5e03\u7684\u5fae\u535a\u5217\u8868"
}], [{
    "id": 5,
    "key": 3,
    "to": 3,
    "text": "\u7528\u6237\u4fe1\u606f"
},
{
    "id": 7,
    "key": 5,
    "to": 3,
    "text": "\u53d1\u5e03\u7684\u5fae\u535a\u5217\u8868"
},
{
    "id": 8,
    "key": 8,
    "to": 3,
    "text": "\u83b7\u53d6\u5171\u540c\u5173\u6ce8"
},
{
    "id": 9,
    "key": 9,
    "to": 3,
    "text": "\u83b7\u53d6\u5171\u540c\u8f6c\u53d1"
},
{
    "id": 10,
    "key": 6,
    "to": 4,
    "text": "\u5fae\u535a\u4fe1\u606f"
},
{
    "id": 11,
    "key": 7,
    "to": 4,
    "text": "\u8f6c\u8bc4\u8d5e"
}]], [[{
    "id": 13,
    "key": 2,
    "to": 0,
    "text": "mid"
}], [{
    "id": 14,
    "key": 6,
    "to": 13,
    "text": "\u5fae\u535a\u4fe1\u606f"
},
{
    "id": 15,
    "key": 7,
    "to": 13,
    "text": "\u8f6c\u8bc4\u8d5e"
}]

]);		
    
    
    

});
        