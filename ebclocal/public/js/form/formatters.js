
frappe.provide("frappe.form.formatters");

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

// 这样的话所有表单的data类型都会调用翻译方法
frappe.form.formatters.Data = function(value) {
	return value==null ? "" : __(value);
}

frappe.form.formatters.MultiSelect = function(value) {
	if (typeof value == "string") {
		return __(value);
	} else if (Array.isArray(value)) {
		return value.map(v => __(v));
	}
}