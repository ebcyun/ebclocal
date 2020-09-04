// 时间区间语言没有设置

const MyControlDateRange = frappe.ui.form.ControlDateRange.extend({
    set_date_options: function() {
		this._super();
		let lang = "en";
		frappe.boot.user && (lang = frappe.boot.user.language);
		if($.fn.datepicker.language[lang]) {
			this.datepicker_options.language = lang
        }
	},
})

frappe.ui.form.ControlDateRange = MyControlDateRange