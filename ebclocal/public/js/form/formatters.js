/**
 * 修改记录：
 * 1. 销售订单明细行里面，因为加上了包装，而这个包装也是一个可选择的物料
 * 		物料选择弹框里面，当可编辑时，link是往control-input里面写值，不可编辑时，是往control-value里面写值
 * 		单据提交之后就变成不能修改了
 * 		而control-value里面的值会应用格式化值，就是下面的方法，这里把Link的格式化重写一下
 * 		就是加了一个判断条件，如果单据类型是Item，字段名是c_package_item
 */

frappe.provide("frappe.form.formatters");

// const not_formatters_name = ["c_package_item"]

frappe.form.formatters.Link = function(value, docfield, options, doc) {
	var doctype = docfield._options || docfield.options;
	var original_value = value;
	if(value && value.match && value.match(/^['"].*['"]$/)) {
		value.replace(/^.(.*).$/, "$1");
	}

	if(options && (options.for_print || options.only_value)) {
		return value;
	}

	if(frappe.form.link_formatters[doctype]) {
		// 这里特殊处理下销售订单明细里面的明细行的包装物料，因为提交之后的显示显示成了--包装物料：行物料名
		// don't apply formatters in case of composite (parent field of same type)
		if (doc && doctype !== doc.doctype) {
			if (doctype === "Item" && docfield.fieldname === "c_package_item" ) {
				if(doc.c_package_item_name && doc.c_package_item_name !== value) {
					return value? value + ': ' + doc.c_package_item_name: doc.c_package_item_name;
				} else {
					return value;
				}
			} else {
				value = frappe.form.link_formatters[doctype](value, doc);
			}
		}
	}

	if(!value) {
		return "";
	}
	if(value[0] == "'" && value[value.length -1] == "'") {
		return value.substring(1, value.length - 1);
	}
	if(docfield && docfield.link_onclick) {
		return repl('<a onclick="%(onclick)s">%(value)s</a>',
			{onclick: docfield.link_onclick.replace(/"/g, '&quot;'), value:value});
	} else if(docfield && doctype) {
		return `<a class="grey"
			href="#Form/${encodeURIComponent(doctype)}/${encodeURIComponent(original_value)}"
			data-doctype="${doctype}"
			data-name="${original_value}">
			${__(options && options.label || value)}</a>`
	} else {
		return value;
	}
}

// 修改日期时间格式化， YYYY-MM-DD  HH:mm:ss
frappe.form.formatters.Datetime = function(value) {
	if(value) {
		var m = moment(frappe.datetime.convert_to_user_tz(value));
		if(frappe.boot.sysdefaults.time_zone) {
			m = m.tz(frappe.boot.sysdefaults.time_zone);
		}
		return m.format(frappe.boot.sysdefaults.date_format.toUpperCase() + ' HH:mm:ss');
	} else {
		return "";
	}
}

// 这样的话所有表单的data类型都会调用翻译方法，不知道会不会有性能问题
frappe.form.formatters.Data = function(value) {
	return value==null ? "" : __(value);
}

// 新增加一个类型：翻译字符串，以后是不是可以把要翻译的字符串定义成这个类型
frappe.form.formatters.TranslationData = function(value) {
	return value==null ? "" : __(value);
}

frappe.form.formatters.MultiSelect = function(value) {
	if (typeof value == "string") {
		return __(value);
	} else if (Array.isArray(value)) {
		return value.map(v => __(v));
	}
}