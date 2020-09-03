
frappe.provide('frappe.views');

var MyGroupBy = class MyGroupBy extends frappe.ui.GroupBy {
	show_hide_aggregate_on() {
		let fn = this.aggregate_function_select.val();
		if (fn === 'sum' || fn === 'avg') {
			if (!this.aggregate_on_html.length) {
				this.aggregate_on_html = `<option value="" disabled selected>
					${__("Select Field...")}</option>`;

				for (let doctype in this.all_fields) {
					const doctype_fields = this.all_fields[doctype];
					doctype_fields.forEach(field => {
						// pick numeric fields for sum / avg
						if (frappe.model.is_numeric_field(field.fieldtype)) {
							let option_text = doctype == this.doctype
								? __(field.label)
								: `${__(field.label)} (${__(doctype)})`;
							this.aggregate_on_html+= `<option data-doctype="${doctype}"
								value="${field.fieldname}">${option_text}</option>`;
						}
					});
				}
			}
			this.aggregate_on_select.html(this.aggregate_on_html);
			this.aggregate_on_select.show();
		} else {
			// count, so no aggregate function
			this.aggregate_on_select.hide();
		}
	}
	get_group_by_docfield() {
		// called from build_column
		let docfield;
		if (this.aggregate_function === 'count') {
			docfield = {
				fieldtype: 'Int',
				label: __('Count'),
				parent: this.doctype,
				width: 120
			};
		} else {
			// get properties of "aggregate_on", for example Net Total
			docfield = Object.assign({}, frappe.meta.docfield_map[this.aggregate_on_doctype][this.aggregate_on]);
			if (this.aggregate_function === 'sum') {
				docfield.label = "'" + __(docfield.label) + "' 的总和";
			} else {
				docfield.label = "'" + __(docfield.label) + "' 的平均值";
			}
		}
		docfield.fieldname = '_aggregate_column';

		return docfield;
	}
}

frappe.ui.GroupBy = MyGroupBy
