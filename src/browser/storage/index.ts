/**
 * 初始化配置项
 */
type CustomStorageConfig = {
    /** 存储模式 */
    mode: 'session' | 'local';
    /** 过期时间 */
    timeout?: number;
};

/**
 * 存储数据的类型
 */
type StorageSaveData = {
    /** 存储时间 */
    timestamp: number;
    /** 数据实体 */
    data: any;
    /** 过期时间，单位 ms */
    timeout?: number;
};

/**
 * 是否可以被 JSON 序列化
 */
function canStringify(data: any) {
    if (typeof data === 'undefined') {
        return false;
    }
    if (typeof data === 'symbol') {
        return false;
    }
    return !(data instanceof Function);
}

/**
 * 判断数据不是某种类型的方法集合
 */
const not = {
    /** 不是 object 类型 */
    object: value => !(value instanceof Object),
    /** 不是 string 类型 */
    string: value => typeof value !== 'string',
    /** 不是 number 类型 */
    number: value => typeof value !== 'number',
    /** 不是 undefined 类型 */
    undefined: value => value !== undefined,
};

/**
 * 存储类
 */
class CustomStorage {
    /** 存储对象 */
    private storage: Storage;
    /** 全局配置 */
    private config: CustomStorageConfig;

    constructor(config: CustomStorageConfig) {
        if (window && window.location && window.sessionStorage) {
            // 参数校验
            if (not.object(config)) {
                throw new TypeError('当前配置的 `config` 不是 `object` 类型，请检查传入配置');
            }
            if (not.string(config.mode)) {
                throw new TypeError('当前配置的 `mode` 不是 `string` 类型，请检查传入配置');
            }
            if (not.undefined(config.timeout) && not.number(config.timeout)) {
                throw new TypeError('当前配置的 `timeout` 不是 `number` 类型，请检查传入配置');
            }

            // 指定使用 sessionStorage 或者 localStorage
            switch (config.mode) {
                case 'session':
                    this.storage = window.sessionStorage;
                    break;
                case 'local':
                    this.storage = window.localStorage;
                    break;
                default:
                    throw new TypeError('当前配置的 `mode` 无法识别，请检查传入配置');
            }
            this.config = config;
        } else {
            throw new TypeError('当前环境不是浏览器，无法使用 window 对象');
        }
    }

    /**
     * 是否存在当前存储 key
     * @param key 当前存储 key
     */
    hasItem(key: string) {
        if (not.string(key)) {
            throw new TypeError('参数 `key` 的类型不是 `string`，请检查传入参数');
        }
        return this.storage.hasOwnProperty(key);
    }

    /**
     * 设置存储数据
     * @param key 当前存储 key
     * @param value 当前存储 value
     * @param timeout 过期时间，单位 ms
     */
    setItem(key: string, value: any, timeout?: number) {
        if (not.string(key)) {
            throw new TypeError('参数 `key` 的类型不是 `string`，请检查传入参数');
        }
        if (!canStringify(value)) {
            throw new TypeError('参数 `value` 不支持 `JSON.stringify` 方法，请检查当前数据');
        }
        if (not.undefined(timeout) && not.number(timeout)) {
            throw new TypeError('参数 `timeout` 的类型不是 `string`，请检查传入参数');
        }

        const saveData: StorageSaveData = {
            timestamp: Date.now(),
            data: value,
            timeout,
        };
        this.storage.setItem(key, JSON.stringify(saveData));
    }

    /**
     * 获取存储数据
     * @param key 当前存储 key
     */
    getItem<T = any>(key: string): T | null {
        if (!this.hasItem(key)) {
            return null;
        }

        /** 存储的数据 */
        const content: StorageSaveData = JSON.parse(this.storage.getItem(key));
        // 内容为空，返回 null
        if (!content) {
            return null;
        }
        // 存储时间为空，返回存储的数据
        if (!content.timestamp) {
            return content?.data ?? null;
        }

        /** 当前时间与存储时间的时间差 */
        const timeDiff = Date.now() - content.timestamp;
        // 设置了过期时间并且小于时间差，返回 null 并删除这条数据
        if (content.timeout && timeDiff >= content.timeout) {
            this.removeItem(key);
            return null;
        }
        // 设置了默认过期时间并且小于时间差，返回 null 并删除这条数据
        if (this.config.timeout && timeDiff >= this.config.timeout) {
            this.removeItem(key);
            return null;
        }

        // 返回存储的数据
        return content?.data ?? null;
    }

    /**
     * 移除存储数据
     * @param key 当前存储 key
     */
    removeItem(key: string) {
        if (this.hasItem(key)) {
            this.storage.removeItem(key);
        }
    }

    /**
     * 更改存储数据
     * @template T
     * @param key 当前存储 key
     * @param onChange 回调函数，参数为当前存储 key 对应的数据，返回值将作为新的存储数据
     */
    changeItem<T = any>(key: string, onChange: (oldValue: T) => T | null) {
        const data = this.getItem<T>(key);
        this.setItem(key, onChange(data));
    }

    /**
     * 清除所有存储数据
     */
    clearAll() {
        this.storage.clear();
    }
}

export default CustomStorage;
