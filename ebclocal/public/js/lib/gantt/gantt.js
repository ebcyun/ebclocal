let MyGanttView = class MyGanttView extends frappe.views.GanttView {
    get required_libs() {
		return [
			"assets/ebc/js/lib/gantt/frappe-gantt.css",
			"assets/ebc/js/lib/gantt/frappe-gantt.min.js"
		];
	}
}

frappe.views.GanttView = MyGanttView