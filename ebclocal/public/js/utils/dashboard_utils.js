frappe.dashboard_utils.render_chart_filters = function(filters, button_class, container, append) {
    filters.forEach(filter => {
        let chart_filter_html =
            `<div class="${button_class} btn-group dropdown pull-right">
                <a class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <button class="btn btn-default btn-xs">
                        <span class="filter-label">${__(filter.label)}</span>
                        <span class="caret"></span>
                    </button>
            </a>`;
        let options_html;

        if (filter.fieldnames) {
            options_html = filter.options.map((option, i) =>
                `<li><a data-fieldname = "${filter.fieldnames[i]}" data-value="${option}">${__(option)}</a></li>`).join('');
        } else {
            options_html = filter.options.map( option => `<li><a data-value="${option}">${__(option)}</a></li>`).join('');
        }

        let dropdown_html = chart_filter_html + `<ul class="dropdown-menu">${options_html}</ul></div>`;
        let $chart_filter = $(dropdown_html);

        if (append) {
            $chart_filter.prependTo(container);
        } else $chart_filter.appendTo(container);

        $chart_filter.find('.dropdown-menu').on('click', 'li a', (e) => {
            let $el = $(e.currentTarget);
            let fieldname;
            let re_value;
            if ($el.attr('data-fieldname')) {
                fieldname = $el.attr('data-fieldname');
            }
            // 获取真正值，
            if ($el.attr('data-value')) {
                re_value = $el.attr('data-value');
            } else {
                re_value = $el.text();
            }

            let selected_item = $el.text();
            $el.parents(`.${button_class}`).find('.filter-label').text(selected_item);
            filter.action(re_value, fieldname);
        });
    });

}