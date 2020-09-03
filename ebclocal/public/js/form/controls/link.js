
// 修改link类型数据的翻译，主要就是添加了一个方法set_formatted_input，给input设置值的时候设置翻译过后的值
// 然后在获取焦点和失去焦点的时候取值逻辑修改一下
const MyControlLink = frappe.ui.form.ControlLink.extend({
	make_input: function() {
		var me = this;
		// line-height: 1 is for Mozilla 51, shows extra padding otherwise
		$('<div class="link-field ui-front" style="position: relative; line-height: 1;">\
			<input type="text" class="input-with-feedback form-control data-value">\
			<span class="link-btn">\
				<a class="btn-open no-decoration" title="' + __("Open Link") + '">\
					<i class="octicon octicon-arrow-right"></i></a>\
			</span>\
		</div>').prependTo(this.input_area);
		this.$input_area = $(this.input_area);
		this.$input = this.$input_area.find('input');
		this.$link = this.$input_area.find('.link-btn');
		this.$link_open = this.$link.find('.btn-open');
		this.set_input_attributes();
		this.$input.on("focus", function() {
			setTimeout(function() {
				if(me.$input.val() && me.get_options()) {
                    let doctype = me.get_options();
					// 修改取值逻辑，直接从doc中取，不从input框中取了
					let real_value = me.doc ? me.doc[me.df['fieldname']] : me.$input.attr("data-value")
					let name = real_value ? real_value : me.get_input_value();
					me.$link.toggle(true);
					me.$link_open.attr('href', frappe.utils.get_form_link(doctype, name));
				}

				if(!me.$input.val()) {
					me.$input.val("").trigger("input");
				}
			}, 500);
		});
		this.$input.on("blur", function() {
			// if this disappears immediately, the user's click
			// does not register, hence timeout
			setTimeout(function() {
				me.$link.toggle(false);
			}, 500);
		});
		this.$input.attr('data-target', this.df.options);
		this.input = this.$input.get(0);
		this.has_input = true;
		this.translate_values = true;
		this.setup_buttons();
		this.setup_awesomeplete();
    },
    setup_awesomeplete: function() {
		var me = this;

		this.$input.cache = {};

		this.awesomplete = new Awesomplete(me.input, {
			minChars: 0,
			maxItems: 99,
			autoFirst: true,
			list: [],
			data: function (item) {
				return {
					label: item.label || item.value,
					value: item.value
				};
			},
			filter: function() {
				return true;
			},
			item: function (item) {
				var d = this.get_item(item.value);
				if(!d.label) {	d.label = d.value; }

				var _label = (me.translate_values) ? __(d.label) : d.label;
				var html = d.html || "<strong>" + _label + "</strong>";
				if(d.description && d.value!==d.description) {
					html += '<br><span class="small">' + __(d.description) + '</span>';
				}
				return $('<li></li>')
					.data('item.autocomplete', d)
					.prop('aria-selected', 'false')
					.html('<a><p>' + html + '</p></a>')
					.get(0);
			},
			sort: function() {
				return 0;
			},
			// 添加这个方法，让它选择之后不自动给他赋值，因为这里本来就会给输入框赋值的，防止多次赋值闪一下
			replace: function(text) {
				
			}
		});

		this.$input.on("input", frappe.utils.debounce(function(e) {
			me.$link.toggle(false);
			var doctype = me.get_options();
			if(!doctype) return;
			if (!me.$input.cache[doctype]) {
				me.$input.cache[doctype] = {};
			}

			var term = e.target.value;

			if (me.$input.cache[doctype][term]!=null) {
				// immediately show from cache
				me.awesomplete.list = me.$input.cache[doctype][term];
			}
			var args = {
				'txt': term,
				'doctype': doctype,
				'ignore_user_permissions': me.df.ignore_user_permissions,
				'reference_doctype': me.get_reference_doctype() || ""
			};

			me.set_custom_query(args);

			frappe.call({
				type: "POST",
				method:'frappe.desk.search.search_link',
				no_spinner: true,
				args: args,
				callback: function(r) {
					if(!me.$input.is(":focus")) {
						return;
					}
					r.results = me.merge_duplicates(r.results);

					// show filter description in awesomplete
					if (args.filters) {
						let filter_string = me.get_filter_description(args.filters);
						if (filter_string) {
							r.results.push({
								html: `<span class="text-muted">${filter_string}</span>`,
								value: '',
								action: () => {}
							});
						}
					}

					if(!me.df.only_select) {
						if(frappe.model.can_create(doctype)) {
							// new item
							r.results.push({
								label: "<span class='text-primary link-option'>"
									+ "<i class='fa fa-plus' style='margin-right: 5px;'></i> "
									+ __("Create a new {0}", [__(me.get_options())])
									+ "</span>",
								value: "create_new__link_option",
								action: me.new_doc
							});
						}
						// advanced search

						if (locals && locals['DocType']) {
							// not applicable in web forms
							r.results.push({
								label: "<span class='text-primary link-option'>"
									+ "<i class='fa fa-search' style='margin-right: 5px;'></i> "
									+ __("Advanced Search")
									+ "</span>",
								value: "advanced_search__link_option",
								action: me.open_advanced_search
							});
						}
					}
					me.$input.cache[doctype][term] = r.results;
					me.awesomplete.list = me.$input.cache[doctype][term];
				}
			});
		}, 500));

		this.$input.on("blur", function() {
			if(me.selected) {
				me.selected = false;
				return;
            }
            // 修改取值对比逻辑， 输入框的值和翻译过后的doc中值不一样，就取输入框的值，一样就取doc中的值
			var input_value = me.get_input_value();
			var real_value = me.doc ? me.doc[me.df['fieldname']] : me.$input.attr("data-value")
			var value = __(real_value) != input_value ? input_value : real_value
			if(value!==me.last_value) {
				me.parse_validate_and_set_in_model(value);
			}
		});

		this.$input.on("awesomplete-open", function() {
			me.$wrapper.css({"z-index": 100});
			me.$wrapper.find('ul').css({"z-index": 100});
			me.autocomplete_open = true;
		});

		this.$input.on("awesomplete-close", function() {
			me.$wrapper.css({"z-index": 1});
			me.autocomplete_open = false;
		});

		this.$input.on("awesomplete-select", function(e) {
			var o = e.originalEvent;
			var item = me.awesomplete.get_item(o.text.value);

			me.autocomplete_open = false;

			// prevent selection on tab
			var TABKEY = 9;
			if(e.keyCode === TABKEY) {
				e.preventDefault();
				me.awesomplete.close();
				return false;
			}

			if(item.action) {
				item.value = "";
				item.action.apply(me);
			}

			// if remember_last_selected is checked in the doctype against the field,
			// then add this value
			// to defaults so you do not need to set it again
			// unless it is changed.
			if(me.df.remember_last_selected_value) {
				frappe.boot.user.last_selected_values[me.df.options] = item.value;
			}
			me.parse_validate_and_set_in_model(item.value);
			
		});

		this.$input.on("awesomplete-selectcomplete", function(e) {
			var o = e.originalEvent;
			if(o.text.value.indexOf("__link_option") !== -1) {
				me.$input.val("");
			}
		});
	},
    // 添加的方法
    set_formatted_input: function(value) {
		var me = this
		me.$input && me.$input.attr("data-value", value === undefined ? '' : value)
		me.$input && me.$input.val(me.format_for_input(__(value)));
	},

	// 获取本来的值
	get_value: function() {
		let me = this
		let real_value = me.doc ? me.doc[me.df['fieldname']] : (me.$input ? me.$input.attr("data-value") : undefined)
		let value = real_value ? real_value : me.get_input_value();
		if(this.get_status()==='Write') {
			return this.parse ? this.parse(value) : value;
		} else {
			return value || undefined;
		}
	},
})

frappe.ui.form.ControlLink = MyControlLink