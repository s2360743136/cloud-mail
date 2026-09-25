// 字母头像工具：邮箱栏、邮件详情里用首字母 + 彩色圆底代替原来的纯文字，
// 同一个邮箱/发件人每次算出来的颜色都一样，多个邮箱之间一眼能区分。

// 8 个饱和度相近的颜色，白字压在上面都清楚
const AVATAR_COLORS = [
    '#3370FF', // 蓝
    '#7A5AF8', // 紫
    '#12B5A5', // 青
    '#F08C00', // 橙
    '#E5484D', // 红
    '#2F9E44', // 绿
    '#D6409F', // 粉
    '#0C8CE9', // 天蓝
]

// 按字符串算一个稳定的哈希（31 进制累乘，>>> 0 保证是非负 32 位整数），再对颜色数取模
export function avatarColor(text) {
    let hash = 0
    for (const ch of String(text || '')) {
        hash = (hash * 31 + ch.codePointAt(0)) >>> 0
    }
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// 取第一个字符并转大写；用展开运算符按"字符"而不是按 UTF-16 单元取，中文名、emoji 开头的名字也不会截成半个字
export function avatarLetter(text) {
    const first = [...String(text || '').trim()][0]
    return first ? first.toUpperCase() : '?'
}
