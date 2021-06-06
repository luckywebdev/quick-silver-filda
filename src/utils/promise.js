export const promiseWithTimeout = promise => {
    let timeoutId
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Promise timed out')), 30000)
    })

    return {
        promiseOrTimeout: Promise.race([promise, !window.document.hidden ? timeoutPromise : null]),
        timeoutId
    }
}
