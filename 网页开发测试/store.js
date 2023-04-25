var option = {
  lon: 122,
  lat: 30,
  zoom: 10,
  watch: [],
};

var origin = new Proxy(option, {
  set: function (target, key, newValue, receiver) {
    Reflect.set(target, key, newValue);
    limitFn();
    return true;
  },

  get: function (target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
});

function refresh() {
  for (let fn of origin.watch) {
    fn(origin);
  }
}
const limitFn = debounce(refresh, 10);

function debounce(func, delay) {
  var timer = null;
  return function () {
    var that = this;
    var args = arguments;
    //每次触发事件 都把定时器清掉重新计时
    clearTimeout(timer);
    timer = setTimeout(function () {
      //执行事件处理程序
      func.call(that, args);
    }, delay);
  };
}

export { origin };
