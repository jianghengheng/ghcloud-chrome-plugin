const form = layui.form;
const layer = layui.layer;

// 数据初始化
try {
  getLocalURL();
  getSessionStorage();
  checkContentScript();
  getLocalConfig();
} catch (error) {}

// config.js 注入状态切换
form.on("switch(injectStatus)", function (data) {
  if (data.elem.checked) {
    chrome.scripting.registerContentScripts([
      {
        id: "config-script",
        js: ["config.js"],
        persistAcrossSessions: false,
        matches: ["<all_urls>"],
        runAt: "document_start",
      },
    ]);
  } else {
    closeConfigJsInject();
  }
  layer.msg("切换成功，刷新页面生效");
});

// header 注入状态切换
form.on("switch(headerInjectStatus)", async function (data) {
  if (data.elem.checked) {
    const requestHeaders = [];
    await chrome.storage.local.get().then((res) => {
      for (const key in res) {
        const element = res[key];
        if (element.applyType === "modifyHeaders") {
          requestHeaders.push({
            header: key,
            operation: "set",
            value: element.value,
          });
        }
      }
    });
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          condition: {
            resourceTypes: ["xmlhttprequest"],
          },
          action: {
            type: "modifyHeaders",
            requestHeaders: requestHeaders,
          },
        },
      ],
    });
  } else {
    closeHeaderInject();
  }
  layer.msg("切换成功，刷新页面生效");
});

// 监听 config select 改变
form.on("select(microAppsSelect)", async function (data) {
  const keyName = data.value;
  $("#microAppsItemEntryValue").val("");
  const entry = await getStoreByKeyName(keyName);
  if (entry) {
    $("#microAppsItemEntryValue").val(entry);
  }
});

// 表格内复制按钮
$(".copy-btn-td").click((e) => {
  const clickDom = $(e)[0].currentTarget;
  const copyText = $(clickDom).parent().prev().text();
  navigator.clipboard.writeText(copyText);
  layer.msg("复制成功");
});

// 保存配置
$(".layui-form").on("click", ".apply-btn", function () {
  const dom = $(this)[0];
  const applyType = $(dom).attr("data-applyType");
  const value = $(dom).prev().val() || null;
  let keyName = $(dom).prev().attr("name");
  if (applyType === "microApps") {
    keyName = $("#microAppsSelect").val();
  }
  if (applyType === "modifyHeaders") {
    closeHeaderInject();
  }

  if (value) {
    const params = {};
    params[keyName] = { applyType, value };
    chrome.storage.local.set(params);
  } else {
    chrome.storage.local.remove([keyName]);
  }
  layer.msg("应用成功，开启注入后刷新生效");
});

// 清空本地配置
$("#clearLocalConfig").click(() => {
  layer.confirm(
    "确认清空？",
    { icon: 3, skin: "layui-layer-molv" },
    async function () {
      closeHeaderInject();
      closeConfigJsInject();
      chrome.storage.local.get().then((res) => {
        const removeKey = [];
        for (const key in res) {
          removeKey.push(key);
        }
        chrome.storage.local.remove(removeKey);
        window.location.reload();
      });
    }
  );
});
