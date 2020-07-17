//因网络问题导致emoji无法远程加载，改成加载本地json文件，
frappe.chat.emoji  = function (fn) {
	return new Promise(resolve => {
		if ( !frappe._.is_empty(frappe.chat.emojis) ) {
			if ( fn )
				fn(frappe.chat.emojis);

			resolve(frappe.chat.emojis)
		}
		else
			$.get('/assets/ebc/js/lib/emoji.json', (data) => {
				frappe.chat.emojis = data;

				if ( fn )
					fn(frappe.chat.emojis);

				resolve(frappe.chat.emojis)
			})
	})
}