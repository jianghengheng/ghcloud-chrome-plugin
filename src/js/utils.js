function test(){
  alert(123231)
}

/** 获取当前url */
function getLocalURL() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs.length) {
      let url = tabs[0].url;
      $("#domain-url").text(url);
    }
  });
}

/** 获取当前标签页信息 */
async function getTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (res) {
      resolve(res);
    });
  });
}

/** 获取 SessionStorage 数据 */
async function getSessionStorage() {
  const [tabData] = await getTab();
  const { id: tabId } = tabData;
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId, allFrames: true },
      files: ["src/js/session.js"],
    },
    function (res) {
      const data = res ? res[0].result : {};
      data["GH-Token"] &&
        $("#domain-token").text("bearer " + data["GH-Token"].access_token);
      data["GH-NowEnterprise"] &&
        $("#domain-tenant").text(data["GH-NowEnterprise"].code);
      data["GH-UserInfo"] &&
        $("#domain-username").text(data["GH-UserInfo"].name);
      data["GH-UserInfo"] && $("#domain-userId").text(data["GH-UserInfo"].id);

      // 将没有信息的隐藏掉 RNM、真不会写JQ了
      const trs = $("#info-tbody").find("tr");
      trs.each((e) => {
        if (!$($(trs.eq(e)[0]).find("td").eq(1)[0]).text()) {
          $(trs.eq(e)).remove();
        }
      });
    }
  );
}

/** 检查脚本注入状态 */
function checkContentScript() {
  chrome.scripting.getRegisteredContentScripts().then((scripts) => {
    form.val("config-inject", {
      injectStatus: !!scripts.length, // 开关状态
    });
  });
  chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
    form.val("header-inject", {
      headerInjectStatus: !!rules.length, // 开关状态
    });
  });
}

/** 获取配置 并结合本地缓存 整合数据 */
function getLocalConfig() {
  $.get("http://www.smallwai.com/index/index/ghcloudConfig", async (res) => {
    let firstMicroAppsOptionKeyValue = "";

    for (const item of res.data) {
      if (item.type === "microApps" && item.list.length) {
        item.list.sort((a, b) => {
          return (a.name + "").localeCompare(b.name + "");
        });
        firstMicroAppsOptionKeyValue =
          (await getStoreByKeyName(item.list[0].name)) ?? "";
      } else {
        item.keyValue = (await getStoreByKeyName(item.keyName)) ?? "";
      }
    }

    res.data.forEach((item) => {
      if (item.type === "microApps") {
        let optionDoms = "";
        item.list.forEach((e) => {
          optionDoms += `<option value="${e.name}">${e.name}</option>`;
        });
        $("#config-inject-form").append(
          `
						<div class="layui-form-item">
								<label class="layui-form-label" style='width:30%;padding-top:0;padding-right:0'>
									<select lay-search="" name='microApps' id='microAppsSelect' lay-filter="microAppsSelect">
									${optionDoms}
									</select>
								</label>
								<div class="layui-input-block microApps-item">
									<input type="text" placeholder="请输入" class="layui-input" id='microAppsItemEntryValue' value='${firstMicroAppsOptionKeyValue}'>
									<button type="button" class="layui-btn apply-btn" data-applyType='microApps'>应用</button>
								</div>
						</div>
					`
        );
      } else {
        $("#config-inject-form").append(
          `
							<div class="layui-form-item">
									<label class="layui-form-label">
										${item.label}：
									</label>
									<div class="layui-input-block microApps-item">
											<input type="text" name="${item.keyName}" placeholder="请输入" class="layui-input" value='${item.keyValue}'>
											<button type="button" class="layui-btn apply-btn" data-applyType='keyValue'>应用</button>
									</div>
							</div>
							`
        );
      }
    });
    form.render();
  });

  chrome.storage.local.get().then((res) => {
    for (const key in res) {
      const element = res[key];
      if (element.applyType === "modifyHeaders") {
        const params = {};
        params[key] = element.value;
        form.val("header-inject", params);
      }
    }
  });
}

/** 根据 KeyName 获取缓存中的数据 */
async function getStoreByKeyName(keyName) {
  return new Promise((resolve) => {
    chrome.storage.local.get([keyName], function (res) {
      resolve(res[keyName] ? res[keyName].value : "");
    });
  });
}

// 取消 header 注入
function closeHeaderInject() {
  try {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1],
    });
    form.val("header-inject", {
      headerInjectStatus: false,
    });
  } catch (error) {}
}

// 取消 config.js 注入
function closeConfigJsInject() {
  try {
    chrome.scripting.unregisterContentScripts({ ids: ["config-script"] });
    form.val("config-inject", {
      injectStatus: false,
    });
  } catch (error) {}
}