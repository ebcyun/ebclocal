# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "ebclocal"
app_title = "EBCLocal"
app_publisher = "petel_zhang"
app_description = "EBCLocal"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "zhangpengfei1125@qq.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/ebclocal/css/ebclocal.css"
app_include_js = "/assets/ebclocal/js/ebclocal.js"

# include js, css files in header of web template
# web_include_css = "/assets/ebclocal/css/ebclocal.css"
# web_include_js = "/assets/ebclocal/js/ebclocal.js"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "ebclocal.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "ebclocal.install.before_install"
# after_install = "ebclocal.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "ebclocal.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"*": {
        "before_validate": "ebclocal.utils.data.money_in_words_zh_hooks"
#       "on_update": "method",
#       "on_cancel": "method",
#       "on_trash": "method"
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"ebclocal.tasks.all"
# 	],
# 	"daily": [
# 		"ebclocal.tasks.daily"
# 	],
# 	"hourly": [
# 		"ebclocal.tasks.hourly"
# 	],
# 	"weekly": [
# 		"ebclocal.tasks.weekly"
# 	]
# 	"monthly": [
# 		"ebclocal.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "ebclocal.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "ebclocal.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "ebclocal.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

