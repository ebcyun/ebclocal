import { Chart, Heatmap } from "frappe-charts"

const FONT_SIZE = 10;
const FONT_FILL = '#555b51';
const HEATMAP_SQUARE_SIZE = 10;
const HEATMAP_GUTTER_SIZE = 2;

const COL_WIDTH = HEATMAP_SQUARE_SIZE + HEATMAP_GUTTER_SIZE;
const ROW_HEIGHT = COL_WIDTH;

const MONTH_NAMES = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

const DAY_NAMES_SHORT = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function createSVG(tag, o) {
	var element = document.createElementNS("http://www.w3.org/2000/svg", tag);

	for (var i in o) {
		var val = o[i];

		if (i === "inside") {
			$(val).appendChild(element);
		}
		else if (i === "around") {
			var ref = $(val);
			ref.parentNode.insertBefore(element, ref);
			element.appendChild(ref);

		} else if (i === "styles") {
			if(typeof val === "object") {
				Object.keys(val).map(prop => {
					element.style[prop] = val[prop];
				});
			}
		} else {
			if(i === "className") { i = "class"; }
			if(i === "innerHTML") {
				element['textContent'] = val;
			} else {
				if (val !== undefined) {
					element.setAttribute(i, val);
				}
			}
		}
	}

	return element;
}

function heatSquare(className, x, y, size, radius, fill='none', data={}) {
	let args = {
		className: className,
		x: x,
		y: y,
		width: size,
		height: size,
		rx: radius,
		fill: fill
	};
	Object.keys(data).map(key => {
		args[key] = data[key];
	});
	return createSVG("rect", args);
}

function makeText(className, x, y, content, options = {}) {
	let fontSize = options.fontSize || FONT_SIZE;
	let dy = options.dy !== undefined ? options.dy : (fontSize / 2);
	let fill = options.fill || FONT_FILL;
	let textAnchor = options.textAnchor || 'start';
	return createSVG('text', {
		className: className,
		x: x,
		y: y,
		dy: dy + 'px',
		'font-size': fontSize + 'px',
		fill: fill,
		'text-anchor': textAnchor,
		innerHTML: content
	});
}

Heatmap.prototype.bindTooltip = function() {
    this.container.addEventListener('mousemove', (e) => {
        this.components.forEach(comp => {
            let daySquares = comp.store;
            let daySquare = e.target;
            if(daySquares.includes(daySquare)) {

                let count = daySquare.getAttribute('data-value');
                let dateParts = daySquare.getAttribute('data-date');

                let gOff = this.container.getBoundingClientRect(), pOff = daySquare.getBoundingClientRect();

                let width = parseInt(e.target.getAttribute('width'));
                let x = pOff.left - gOff.left + width/2;
                let y = pOff.top - gOff.top;
                let value = count + ' ' + this.countLabel;
                let name = dateParts + ': ';

                this.tip.setValues(x, y, {name: name, value: value}, []);
                this.tip.showTip();
            }
        });
    });
}

let old_setupComponents = Heatmap.prototype.setupComponents;

Heatmap.prototype.setupComponents = function() {
	old_setupComponents.call(this)
	this.drawArea.innerHTML = '';
	let y_0 = 0;
	DAY_NAMES_SHORT.forEach((dayName, i) => {
		if([1, 3, 5].includes(i)) {
			let dayText = makeText('subdomain-name', -COL_WIDTH/2, y_0, dayName,
				{
					fontSize: HEATMAP_SQUARE_SIZE,
					dy: 8,
					textAnchor: 'end'
				}
			);
			this.drawArea.appendChild(dayText);
		}
		y_0 += ROW_HEIGHT;
	});
    this.components.forEach(c => {
        c.makeElements = function(data) {
			let {index, colWidth, rowHeight, squareSize, radius, xTranslate} = this.constants;
			let monthNameHeight = -12;
			let x = xTranslate, y = 0;
			this.serializedSubDomains = [];
			data.cols.map((week, weekNo) => {
				if(weekNo === 1) {
					this.labels.push(
						makeText('domain-name', x, monthNameHeight, MONTH_NAMES[index],
							{
								fontSize: 9
							}
						)
					);
				}
				week.map((day, i) => {
					if(day.fill) {
						let data = {
							'data-date': day.yyyyMmDd,
							'data-value': day.dataValue,
							'data-day': i
						};
						let square = heatSquare('day', x, y, squareSize, radius, day.fill, data);
						this.serializedSubDomains.push(square);
					}
					y += rowHeight;
				});
				y = 0;
				x += colWidth;
			});

			return this.serializedSubDomains;
		};
    });
}

class MyChart {
    constructor(parent, options) {
        if (options.type === "heatmap") {
            return new Heatmap(parent, options);
        } else {
            return new Chart(parent, options)
        }
    }
}
frappe.Chart = MyChart;