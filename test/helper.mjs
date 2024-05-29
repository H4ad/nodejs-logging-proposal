import split from "split2";

export function sink() {
    return split((data) => {
        try {
            return JSON.parse(data)
        } catch (err) {
            console.log(err)
            console.log(data)
        }
    })
}

export function once(emitter, name) {
    return new Promise((resolve, reject) => {
        if (name !== 'error') emitter.once('error', reject)
        emitter.once(name, (...args) => {
            emitter.removeListener('error', reject)
            resolve(...args)
        })
    })
}
