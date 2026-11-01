import selfsigned from 'selfsigned';
const res = selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 365 });
console.log('is promise:', res instanceof Promise);
const pems = await res;
console.log('resolved keys:', Object.keys(pems));
