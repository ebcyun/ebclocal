// 日历
var MyCalendar = frappe.views.Calendar.extend({
    setup_options: function(defaults) {
        this._super(defaults);
        if (this.cal_options.locale == 'zh') {
            this.cal_options.locale = 'zh-cn'
        }
    }
})

frappe.views.Calendar = MyCalendar


// 列表鼠标悬停中文被转码 其实就改了一行
// 字段值都翻译一下，不止select类型
var MyListView = class MyListView extends frappe.views.ListView {
    get_column_html(col, doc) {
		if (col.type === 'Status') {
			return `
				<div class="list-row-col hidden-xs ellipsis">
					${this.get_indicator_html(doc)}
				</div>
			`;
		}

		const df = col.df || {};
		const label = df.label;
		const fieldname = df.fieldname;
		const value = doc[fieldname] || '';

		const format = () => {
			if (df.fieldtype === 'Code') {
				return value;
			} else if (df.fieldtype === 'Percent') {
				return `<div class="progress level" style="margin: 0px;">
						<div class="progress-bar progress-bar-success" role="progressbar"
							aria-valuenow="${value}"
							aria-valuemin="0" aria-valuemax="100" style="width: ${Math.round(value)}%;">
						</div>
					</div>`;
			} else {
				return frappe.format(value, df, null, doc);
			}
		};

		const field_html = () => {
			let html;
			let _value;
			// listview_setting formatter
			if (this.settings.formatters && this.settings.formatters[fieldname]) {
				_value = this.settings.formatters[fieldname](value, df, doc);
			} else {
				let strip_html_required = df.fieldtype == 'Text Editor'
					|| (df.fetch_from && ['Text', 'Small Text'].includes(df.fieldtype));
				if (strip_html_required) {
					_value = strip_html(value);
				} else {
					_value = typeof value === 'string' ? frappe.utils.escape_html(value) : value;
				}
			}

			if (df.fieldtype === 'Image') {
				html = df.options ?
					`<img src="${doc[df.options]}" style="max-height: 30px; max-width: 100%;">` :
					`<div class="missing-image small">
						<span class="octicon octicon-circle-slash"></span>
					</div>`;
			} else if (df.fieldtype === 'Select') {
				html = `<span class="filterable indicator ${frappe.utils.guess_colour(_value)} ellipsis"
					data-filter="${fieldname},=,${value}">
					${__(_value)}
				</span>`;
			} else if (df.fieldtype === 'Link') {
				html = `<a class="filterable text-muted ellipsis"
					data-filter="${fieldname},=,${value}">
					${__(_value)}
				</a>`;
			} else if (['Text Editor', 'Text', 'Small Text', 'HTML Editor'].includes(df.fieldtype)) {
				html = `<span class="text-muted ellipsis">
					${__(_value)}
				</span>`;
			} else {
				html = `<a class="filterable text-muted ellipsis"
					data-filter="${fieldname},=,${value}">
					${format()}
				</a>`;
			}
			// 这里的escape(_value)改成__(_value)
			return `<span class="ellipsis"
				title="${__(label)}: ${__(_value)}">
				${html}
			</span>`;
		};

		const class_map = {
			Subject: 'list-subject level',
			Field: 'hidden-xs'
		};
		const css_class = [
			'list-row-col ellipsis',
			class_map[col.type],
			frappe.model.is_numeric_field(df) ? 'text-right' : ''
		].join(' ');

		const html_map = {
			Subject: this.get_subject_html(doc),
			Field: field_html()
		};
		const column_html = html_map[col.type];

		return `
			<div class="${css_class}">
				${column_html}
			</div>
		`;
	}

	get_subject_html(doc) {
		let user = frappe.session.user;
		let subject_field = this.columns[0].df;
		let value = doc[subject_field.fieldname] || doc.name;
		let subject = strip_html(value.toString());
		let escaped_subject = frappe.utils.escape_html(subject);

		const liked_by = JSON.parse(doc._liked_by || '[]');
		let heart_class = liked_by.includes(user) ?
			'liked-by' : 'text-extra-muted not-liked';

		const seen = JSON.parse(doc._seen || '[]')
			.includes(user) ? '' : 'bold';

		// 这里的改成title="xxxx" 和${subject} 都加上了翻译 __()
		let subject_html = `
			<input class="level-item list-row-checkbox hidden-xs" type="checkbox" data-name="${escape(doc.name)}">
			<span class="level-item" style="margin-bottom: 1px;">
				<i class="octicon octicon-heart like-action ${heart_class}"
					data-name="${doc.name}" data-doctype="${this.doctype}"
					data-liked-by="${encodeURI(doc._liked_by) || '[]'}"
				>
				</i>
				<span class="likes-count">
					${ liked_by.length > 99 ? __("99") + '+' : __(liked_by.length || '')}
				</span>
			</span>
			<span class="level-item ${seen} ellipsis" title="${__(escaped_subject)}">
				<a class="ellipsis" href="${this.get_form_link(doc)}" title="${__(escaped_subject)}" data-doctype="${this.doctype}" data-name="${doc.name}">
				${__(subject)}
				</a>
			</span>
		`;

		return subject_html;
	}
}

frappe.views.ListView = MyListView

//因网络问题导致emoji无法远程加载，改成加载本地json文件，
frappe.chat.emoji  = function (fn) {
	return new Promise(resolve => {
		if ( !frappe._.is_empty(frappe.chat.emojis) ) {
			if ( fn )
				fn(frappe.chat.emojis);

			resolve(frappe.chat.emojis)
		}
		else
			$.get('/assets/ebclocal/js/lib/emoji.json', (data) => {
				frappe.chat.emojis = data;

				if ( fn )
					fn(frappe.chat.emojis);

				resolve(frappe.chat.emojis)
			})
	})
}