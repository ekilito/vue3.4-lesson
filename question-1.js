const person = {
  name: "wdl",
  get aliasName() {
    return this.name + "-handsome";
  },
};

let proxyPerson = new Proxy(person, {
  get(target, key, recevier) {
    console.log(key);
    //return target[key] // person.name 不会出发 get
    // recevier 是代理对象
    return Reflect.get(target, key, recevier); // recevier[key]
  },
});

console.log(proxyPerson.aliasName);
