export const getSystemHostname = () => {
    let name = 'localhost';
    if (typeof window !== 'undefined') {
        name = window.location.hostname;
    }

    // @ts-ignore
    if (typeof process !== 'undefined') {
        // @ts-ignore
        name = process.env.HOSTNAME;
    }

    return name;
}

export const getSystemUsername = () => {
    let name = 'unknown';
    if (typeof window !== 'undefined') {
        name = window.navigator.userAgent;
    }

    // @ts-ignore
    if (typeof process !== 'undefined') {
        // @ts-ignore
        name = process.env.USER;
    }

    return name;
}

export const generatedID = () => {
    const rand = Math.random().toString(36).substring(2, 15);
    return `${rand}-${new Date().getTime()}`;
}