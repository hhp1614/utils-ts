/**
 * 随机整数
 * @description 随机数范围包括最小值和最大值
 * @param min 最小值
 * @param max 最大值
 */
export function random(min: number, max: number) {
    const random = Math.random();
    return Math.floor(min + random * (max - min + 1));
}
