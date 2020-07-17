from decimal import Decimal
import warnings
import frappe
from frappe.utils.data import *

# 这个金额转大写的，把它原来的方法贴过来了，就是在中间加了一段，判断如果是中文环境，就调用下面的金额转大写方法
def money_in_words_zh(number, main_currency = None, fraction_currency=None):
    """
    Returns string in words with currency and fraction currency.
    """
    from frappe.utils import get_defaults
    _ = frappe._

    try:
        # note: `flt` returns 0 for invalid input and we don't want that
        number = float(number)
    except ValueError:
        return ""

    number = flt(number)
    if number < 0:
        return ""

    d = get_defaults()
    if not main_currency:
        main_currency = d.get('currency', 'INR')
    if not fraction_currency:
        fraction_currency = frappe.db.get_value("Currency", main_currency, "fraction", cache=True) or _("Cent")

    number_format = frappe.db.get_value("Currency", main_currency, "number_format", cache=True) or \
        frappe.db.get_default("number_format") or "#,###.##"

    fraction_length = get_number_format_info(number_format)[2]

    n = "%.{0}f".format(fraction_length) % number

    numbers = n.split('.')

    main, fraction =  numbers if len(numbers) > 1 else [n, '00']

    if len(fraction) < fraction_length:
        zeros = '0' * (fraction_length - len(fraction))
        fraction += zeros

    in_million = True
    if number_format == "#,##,###.##": in_million = False

    # 如果是中文，调用中文的金额转大写
    if (frappe.local.lang == 'zh'):
        return cncurrency(n, prefix=True)

    # 0.00
    if main == '0' and fraction in ['00', '000']:
        out = "{0} {1}".format(main_currency, _('Zero'))
    # 0.XX
    elif main == '0':
        out = _(in_words(fraction, in_million).title()) + ' ' + fraction_currency
    else:
        out = main_currency + ' ' + _(in_words(main, in_million).title())
        if cint(fraction):
            out = out + ' ' + _('and') + ' ' + _(in_words(fraction, in_million).title()) + ' ' + fraction_currency

    return out + ' ' + _('only.')

def cncurrency(value, capital=True, prefix=False, classical=None):
    '''
    参数:
    capital:    True   大写汉字金额
                False  一般汉字金额
    classical:  True   元
                False  圆
    prefix:     True   以'人民币'开头
                False, 无开头
    '''
    if not isinstance(value, (Decimal, str, int)):
        msg = '''
        由于浮点数精度问题，请考虑使用字符串，或者 decimal.Decimal 类。
        因使用浮点数造成误差而带来的可能风险和损失作者概不负责。
        '''
        warnings.warn(msg, UserWarning)
    # 默认大写金额用圆，一般汉字金额用元
    if classical is None:
        classical = True if capital else False

    # 汉字金额前缀
    if prefix is True:
        prefix = '人民币'
    else:
        prefix = ''

    # 汉字金额字符定义
    dunit = ('角', '分')
    if capital:
        num = ('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖')
        iunit = [None, '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟', '万', '拾', '佰', '仟']
    else:
        num = ('〇', '一', '二', '三', '四', '五', '六', '七', '八', '九')
        iunit = [None, '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千', '万', '十', '百', '千']
    if classical:
        iunit[0] = '元' if classical else '圆'
    # 转换为Decimal，并截断多余小数

    if not isinstance(value, Decimal):
        value = Decimal(value).quantize(Decimal('0.01'))

    # 处理负数
    if value < 0:
        prefix += '负'  # 输出前缀，加负
        value = - value  # 取正数部分，无须过多考虑正负数舍入
        # assert - value + value == 0
    # 转化为字符串
    s = str(value)
    if len(s) > 19:
        raise ValueError('金额太大了，不知道该怎么表达。')
    istr, dstr = s.split('.')  # 小数部分和整数部分分别处理
    istr = istr[::-1]  # 翻转整数部分字符串
    so = []  # 用于记录转换结果

    # 零
    if value == 0:
        return prefix + num[0] + iunit[0]
    haszero = False  # 用于标记零的使用
    if dstr == '00':
        haszero = True  # 如果无小数部分，则标记加过零，避免出现“圆零整”

    # 处理小数部分
    # 分
    if dstr[1] != '0':
        so.append(dunit[1])
        so.append(num[int(dstr[1])])
    else:
        so.append('整')  # 无分，则加“整”
    # 角
    if dstr[0] != '0':
        so.append(dunit[0])
        so.append(num[int(dstr[0])])
    elif dstr[1] != '0':
        so.append(num[0])  # 无角有分，添加“零”
        haszero = True  # 标记加过零了
        pass

    # 无整数部分
    if istr == '0':
        if haszero:  # 既然无整数部分，那么去掉角位置上的零
            so.pop()
        so.append(prefix)  # 加前缀
        so.reverse()  # 翻转
        return ''.join(so)

    # 处理整数部分
    for i, n in enumerate(istr):
        n = int(n)
        if i % 4 == 0:  # 在圆、万、亿等位上，即使是零，也必须有单位
            if i == 8 and so[-1] == iunit[4]:  # 亿和万之间全部为零的情况
                so.pop()  # 去掉万
            so.append(iunit[i])
            if n == 0:  # 处理这些位上为零的情况
                if not haszero:  # 如果以前没有加过零
                    so.insert(-1, num[0])  # 则在单位后面加零
                    haszero = True  # 标记加过零了
                pass
            else:  # 处理不为零的情况
                so.append(num[n])
                haszero = False  # 重新开始标记加零的情况
        else:  # 在其他位置上
            if n != 0:  # 不为零的情况
                so.append(iunit[i])
                so.append(num[n])
                haszero = False  # 重新开始标记加零的情况
            else:  # 处理为零的情况
                if not haszero:  # 如果以前没有加过零
                    so.append(num[0])
                    haszero = True
                    pass

    # 最终结果
    so.append(prefix)
    so.reverse()
    return ''.join(so)

# 现在是放在 doc_events *  before_validate中的，因为不确定哪些doctype会用到这个转金额，
# 最好是有启动的钩子
def money_in_words_zh_hooks(*args, **kwargs):
    frappe.utils.data.money_in_words = money_in_words_zh
    frappe.utils.money_in_words = money_in_words_zh