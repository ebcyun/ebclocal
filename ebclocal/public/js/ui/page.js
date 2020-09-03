// 新加一个自动完成的选择框

const MyPage = frappe.ui.Page.extend({
    add_auto_select: function(label, options, change) {
        let field = this.add_field({label:label, fieldtype:"Autocomplete", options: options, change: change});
		return field.$wrapper.find("input").empty();
	},
})

frappe.ui.Page = MyPage;