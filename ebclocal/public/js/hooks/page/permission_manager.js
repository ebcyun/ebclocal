
const MyPermissionEngine = frappe.PermissionEngine.extend({
    setup_page: function() {
		var me = this;
		this.doctype_select
			= this.wrapper.page.add_auto_select(__("Document Type"), this.options.doctypes, 
				function(e) {
					if (e.target.value) {
						frappe.set_route("permission-manager", e.target.value);
					}
				});
		this.role_select
			= this.wrapper.page.add_auto_select(__("Roles"), this.options.roles,
				function() {
					me.refresh();
				});

		this.page.add_inner_button(__('Set User Permissions'), () => {
			return frappe.set_route('List', 'User Permission');
		});
		this.set_from_route();
	},
})

frappe.PermissionEngine = MyPermissionEngine;