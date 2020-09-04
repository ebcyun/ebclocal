import DataTable from "frappe-datatable";
import Style1 from "./style.js";

// 重新定义默认值， 把这几个英文改成中文
const DEFAULT_OPTIONS = {
    headerDropdown: [
        {
            label: '升序',
            action: function (column) {
                this.sortColumn(column.colIndex, 'asc');
            }
        },
        {
            label: '降序',
            action: function (column) {
                this.sortColumn(column.colIndex, 'desc');
            }
        },
        {
            label: '重置',
            action: function (column) {
                this.sortColumn(column.colIndex, 'none');
            }
        },
        {
            label: '删除列',
            action: function (column) {
                this.removeColumn(column.colIndex);
            }
        }
    ]
};

class MyDataTable extends DataTable {
	constructor(wrapper, options) {
		super(wrapper, options);
		// 这里是解决表格有垂直滚动条而表格宽度又小于table的宽度时，垂直滚动条遮盖数据
		// 及高度小于table的高度时，最后一条线画不出来
		this.style = new Style1(this);
		this.style.setBodyStyle();
    }
	buildOptions(options) {
		super.buildOptions(options);
		// 解决headerDropdown英文
		this.options.headerDropdown = [
			...DEFAULT_OPTIONS.headerDropdown,
			...options.headerDropdown
		];
	}
}

// 是否把这个导出去
// frappe.provide("frappe.datatable");
// frappe.datatable = MyDataTable

// 重新定义用到DataTable的那些class, 就是出现 new DataTable的地方都要重写
let MyQueryReport = class MyQueryReport extends frappe.views.QueryReport {
    render_datatable() {
		let data = this.data;
		let columns = this.columns.filter((col) => !col.hidden);

		if (this.raw_data.add_total_row) {
			data = data.slice();
			data.splice(-1, 1);
		}

		if (this.datatable && this.datatable.options
			&& (this.datatable.options.showTotalRow ===this.raw_data.add_total_row)) {
			this.datatable.options.treeView = this.tree_report;
			this.datatable.refresh(data, columns);
		} else {
			let datatable_options = {
				columns: columns,
				data: data,
				inlineFilters: true,
				treeView: this.tree_report,
				layout: 'fixed',
				cellHeight: 33,
				showTotalRow: this.raw_data.add_total_row,
				direction: frappe.utils.is_rtl() ? 'rtl' : 'ltr',
				hooks: {
					columnTotal: frappe.utils.report_column_total
				}
			};

			if (this.report_settings.get_datatable_options) {
				datatable_options = this.report_settings.get_datatable_options(datatable_options);
			}
			this.datatable = new MyDataTable(this.$report[0], datatable_options);
		}

		if (typeof this.report_settings.initial_depth == "number") {
			this.datatable.rowmanager.setTreeDepth(this.report_settings.initial_depth);
		}
		if (this.report_settings.after_datatable_render) {
			this.report_settings.after_datatable_render(this.datatable);
		}
	}
}

frappe.views.QueryReport = MyQueryReport

let MyReportView = class MyReportView extends frappe.views.ReportView {
    setup_datatable(values) {
		this.$datatable_wrapper.empty();
		this.datatable = new MyDataTable(this.$datatable_wrapper[0], {
			columns: this.columns,
			data: this.get_data(values),
			getEditor: this.get_editing_object.bind(this),
			checkboxColumn: true,
			inlineFilters: true,
			cellHeight: 35,
			direction: frappe.utils.is_rtl() ? 'rtl' : 'ltr',
			events: {
				onRemoveColumn: (column) => {
					this.remove_column_from_datatable(column);
				},
				onSwitchColumn: (column1, column2) => {
					this.switch_column(column1, column2);
				},
				onCheckRow: () => {
					const checked_items = this.get_checked_items();
					this.toggle_actions_menu_button(checked_items.length > 0);
				}
			},
			hooks: {
				columnTotal: frappe.utils.report_column_total
			},
			headerDropdown: [{
				label: __('Add Column'),
				action: (datatabe_col) => {
					let columns_in_picker = [];
					const columns = this.get_columns_for_picker();

					columns_in_picker = columns[this.doctype]
						.filter(df => !this.is_column_added(df))
						.map(df => ({
							label: __(df.label),
							value: df.fieldname
						}));

					delete columns[this.doctype];

					for (let cdt in columns) {
						columns[cdt]
							.filter(df => !this.is_column_added(df))
							.map(df => ({
								label: __(df.label) + ` (${cdt})`,
								value: df.fieldname + ',' + cdt
							}))
							.forEach(df => columns_in_picker.push(df));
					}

					const d = new frappe.ui.Dialog({
						title: __('Add Column'),
						fields: [
							{
								label: __('Select Column'),
								fieldname: 'column',
								fieldtype: 'Autocomplete',
								options: columns_in_picker
							},
							{
								label: __('Insert Column Before {0}', [datatabe_col.docfield.label.bold()]),
								fieldname: 'insert_before',
								fieldtype: 'Check'
							}
						],
						primary_action: ({ column, insert_before }) => {
							if (!columns_in_picker.map(col => col.value).includes(column)) {
								frappe.show_alert(__('Invalid column'));
								d.hide();
								return;
							}

							let doctype = this.doctype;
							if (column.includes(',')) {
								[column, doctype] = column.split(',');
							}


							let index = datatabe_col.colIndex;
							if (insert_before) {
								index = index - 1;
							}

							this.add_column_to_datatable(column, doctype, index);
							d.hide();
						}
					});

					d.show();
				}
			}]
		});
	}
}

frappe.views.ReportView = MyReportView

// 这个数据导入的是动态加载的，在这里会找不到frappe.data_import.ImportPreview，
// 这个是放doctype: core/doctype/data_import_beta里面的，应该不会用到，用到再说的话，用doctype的hooks应该可以解决
// let MyImportPreview = class MyImportPreview extends frappe.data_import.ImportPreview {
//     render_datatable() {
// 		if (this.datatable) {
// 			this.datatable.destroy();
// 		}

// 		this.datatable = new DataTable(this.$table_preview.get(0), {
// 			data: this.data,
// 			columns: this.columns,
// 			layout: this.columns.length < 10 ? 'fluid' : 'fixed',
// 			cellHeight: 35,
// 			serialNoColumn: false,
// 			checkboxColumn: false,
// 			noDataMessage: __('No Data'),
// 			disableReorderColumn: true
// 		});

// 		let {
// 			max_rows_exceeded,
// 			max_rows_in_preview,
// 			total_number_of_rows
// 		} = this.preview_data;
// 		if (max_rows_exceeded) {
// 			let parts = [max_rows_in_preview, total_number_of_rows];
// 			this.wrapper.find('.table-message').html(`
// 				<div class="text-muted margin-top text-medium">
// 				${__('Showing only first {0} rows out of {1}', parts)}
// 				</div>
// 			`);
// 		}

// 		if (this.data.length === 0) {
// 			this.datatable.style.setStyle('.dt-scrollable', {
// 				height: 'auto'
// 			});
// 		}

// 		this.datatable.style.setStyle('.dt-dropdown', {
// 			display: 'none'
// 		});
// 	}
// }

// frappe.data_import.ImportPreview = MyImportPreview

// 这个是在erpnext/accounts/page/bank_reconciliation/bank_reconciliation.js中写的，在这里会找不到，
// 等用到再说吧
// let MybankTransactionUpload = class MybankTransactionUpload extends erpnext.accounts.bankTransactionUpload {
//     create_datatable() {
// 		try {
// 			this.datatable = new DataTable('.transactions-table', {
// 				columns: this.data.columns,
// 				data: this.data.data
// 			})
// 		}
// 		catch(err) {
// 			let msg = __(`Your file could not be processed by ERPNext.
// 						<br>It should be a standard CSV or XLSX file.
// 						<br>The headers should be in the first row.`)
// 			frappe.throw(msg)
// 		}

// 	}
// }

// erpnext.accounts.bankTransactionUpload = MybankTransactionUpload