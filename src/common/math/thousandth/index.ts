/**
 * 数字转化为千分位格式
 * @description 超大数字会有问题
 * @param num 数字
 */
export function thousandth(num: number) {
    return (+num).toLocaleString('en-us');
}
