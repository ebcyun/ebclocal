let MyGanttView = class MyGanttView extends frappe.views.GanttView {
    // get required_libs() {
	// 	return [
	// 		"assets/ebc/js/lib/gantt/frappe-gantt.css",
	// 		"assets/ebc/js/lib/gantt/frappe-gantt.min.js"
	// 	];
	// }
	render_gantt() {
		const me = this;
		const gantt_view_mode = this.view_user_settings.gantt_view_mode || 'Day';
		const field_map = this.calendar_settings.field_map;
		const date_format = 'YYYY-MM-DD';

		this.$result.empty();

		this.gantt = new Gantt(this.$result[0], this.tasks, {
			view_mode: gantt_view_mode,
			date_format: "YYYY-MM-DD",
			on_click: task => {
				frappe.set_route('Form', task.doctype, task.id);
			},
			on_date_change: (task, start, end) => {
				if (!me.can_write) return;
				frappe.db.set_value(task.doctype, task.id, {
					[field_map.start]: moment(start).format(date_format),
					[field_map.end]: moment(end).format(date_format)
				});
			},
			on_progress_change: (task, progress) => {
				if (!me.can_write) return;
				var progress_fieldname = 'progress';

				if ($.isFunction(field_map.progress)) {
					progress_fieldname = null;
				} else if (field_map.progress) {
					progress_fieldname = field_map.progress;
				}

				if (progress_fieldname) {
					frappe.db.set_value(task.doctype, task.id, {
						[progress_fieldname]: parseInt(progress)
					});
				}
			},
			on_view_change: mode => {
				// save view mode
				me.save_view_user_settings({
					gantt_view_mode: mode
				});
			},
			custom_popup_html: task => {
				var item = me.get_item(task.id);

				var html =
					`<div class="title">${task.name}</div>
					<div class="subtitle">${moment(task._start).format('MMM D')} - ${moment(task._end).format('MMM D')}</div>`;

				// custom html in doctype settings
				var custom = me.settings.gantt_custom_popup_html;
				if (custom && $.isFunction(custom)) {
					var ganttobj = task;
					html = custom(ganttobj, item);
				}
				return '<div class="details-container">' + html + '</div>';
			},
			language: (frappe.boot.user && frappe.boot.user.language) || 'en'
		});
		this.setup_view_mode_buttons();
		this.set_colors();
	}
}

frappe.views.GanttView = MyGanttView