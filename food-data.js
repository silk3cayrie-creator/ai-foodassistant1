"use strict";

const FOOD_DATA = {
  apple: { name: "苹果", emoji: "🍎", category: "水果", description: "常见水果，含膳食纤维和多种植物化合物。", kcal: 53, protein: 0.4, carbs: 13.7, fat: 0.2, fiber: 1.7, sugar: 10.3, sodium: 2, tags: "水果 苹果 新鲜 纤维" },
  banana: { name: "香蕉", emoji: "🍌", category: "水果", description: "碳水化合物较丰富，适合作为运动前后的便捷能量来源。", kcal: 93, protein: 1.4, carbs: 22.0, fat: 0.2, fiber: 1.2, sugar: 12.2, sodium: 1, tags: "水果 香蕉 能量 钾" },
  orange: { name: "橙子", emoji: "🍊", category: "水果", description: "水分充足，富含维生素 C，整果通常比果汁保留更多纤维。", kcal: 48, protein: 0.8, carbs: 11.1, fat: 0.2, fiber: 1.6, sugar: 8.5, sodium: 1, tags: "水果 橙子 柑橘 维生素C" },
  strawberry: { name: "草莓", emoji: "🍓", category: "水果", description: "能量密度较低，含维生素 C 和多酚类物质。", kcal: 32, protein: 1.0, carbs: 7.1, fat: 0.2, fiber: 1.1, sugar: 4.9, sodium: 4, tags: "水果 草莓 莓果 维生素C" },
  pineapple: { name: "菠萝", emoji: "🍍", category: "水果", description: "酸甜多汁，含一定糖分，建议关注一次食用量。", kcal: 44, protein: 0.5, carbs: 10.8, fat: 0.1, fiber: 1.3, sugar: 9.9, sodium: 1, tags: "水果 菠萝 凤梨" },
  avocado: { name: "牛油果", emoji: "🥑", category: "水果", description: "脂肪含量相对较高，以不饱和脂肪为主，适合控制份量食用。", kcal: 171, protein: 2.0, carbs: 7.4, fat: 15.3, fiber: 6.7, sugar: 0.7, sodium: 7, tags: "水果 牛油果 鳄梨 脂肪" },
  broccoli: { name: "西兰花", emoji: "🥦", category: "蔬菜", description: "十字花科蔬菜，含膳食纤维、维生素 C 等营养素。", kcal: 36, protein: 4.1, carbs: 4.3, fat: 0.6, fiber: 2.8, sugar: 1.7, sodium: 33, tags: "蔬菜 西兰花 绿色 十字花科" },
  carrot: { name: "胡萝卜", emoji: "🥕", category: "蔬菜", description: "富含类胡萝卜素，可与含少量脂肪的食物搭配。", kcal: 39, protein: 1.0, carbs: 8.8, fat: 0.2, fiber: 2.6, sugar: 4.7, sodium: 25, tags: "蔬菜 胡萝卜 根茎 胡萝卜素" },
  corn: { name: "玉米", emoji: "🌽", category: "谷薯类", description: "兼具主食属性和膳食纤维，食用时可计入一餐主食。", kcal: 112, protein: 4.0, carbs: 22.8, fat: 1.2, fiber: 2.9, sugar: 4.5, sodium: 1, tags: "谷物 主食 玉米 粗粮" },
  mushroom: { name: "蘑菇", emoji: "🍄", category: "蔬菜", description: "能量密度较低，具有鲜味，可帮助丰富菜肴口感。", kcal: 24, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 2.1, sugar: 1.7, sodium: 5, tags: "蔬菜 菌菇 蘑菇" },
  egg: { name: "鸡蛋", emoji: "🥚", category: "蛋奶豆类", description: "提供优质蛋白质及多种微量营养素，烹调方式会影响额外油脂。", kcal: 144, protein: 13.3, carbs: 2.8, fat: 8.8, fiber: 0, sugar: 0.4, sodium: 131, tags: "蛋白质 鸡蛋 蛋类 早餐" },
  milk: { name: "牛奶", emoji: "🥛", category: "蛋奶豆类", description: "提供蛋白质和钙，可结合个人乳糖耐受情况选择。", kcal: 65, protein: 3.3, carbs: 4.9, fat: 3.6, fiber: 0, sugar: 4.9, sodium: 37, tags: "奶类 牛奶 蛋白质 钙" },
  rice: { name: "米饭", emoji: "🍚", category: "谷薯类", description: "常见主食，主要提供碳水化合物，建议与蔬菜和蛋白质食物搭配。", kcal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.3, sugar: 0.1, sodium: 2, tags: "主食 米饭 谷物 碳水" },
  bread: { name: "面包", emoji: "🍞", category: "谷薯类", description: "以碳水化合物为主，全谷物面包通常能提供更多膳食纤维。", kcal: 265, protein: 9.0, carbs: 49.0, fat: 3.2, fiber: 2.7, sugar: 5.0, sodium: 491, tags: "主食 面包 烘焙 碳水" },
  noodles: { name: "面条", emoji: "🍜", category: "谷薯类", description: "常见主食，汤面需额外注意汤底中的盐和油。", kcal: 138, protein: 4.5, carbs: 28.6, fat: 0.8, fiber: 1.2, sugar: 0.6, sodium: 5, tags: "主食 面条 碳水" },
  chicken: { name: "鸡肉", emoji: "🍗", category: "肉禽水产", description: "蛋白质含量较高，去皮和少油烹调有助于减少额外脂肪。", kcal: 167, protein: 19.3, carbs: 0, fat: 9.4, fiber: 0, sugar: 0, sodium: 63, tags: "肉类 鸡肉 蛋白质" },
  fish: { name: "鱼肉", emoji: "🐟", category: "肉禽水产", description: "优质蛋白质来源，不同鱼类的脂肪含量和脂肪酸组成有所差异。", kcal: 120, protein: 20.0, carbs: 0, fat: 4.0, fiber: 0, sugar: 0, sodium: 60, tags: "肉类 水产 鱼 蛋白质" },
  pizza: { name: "披萨", emoji: "🍕", category: "复合食品", description: "通常同时含主食、奶酪和加工肉类，能量、脂肪和钠可能较高。", kcal: 266, protein: 11.0, carbs: 33.0, fat: 10.0, fiber: 2.3, sugar: 3.6, sodium: 598, tags: "快餐 披萨 奶酪 高钠" },
  burger: { name: "汉堡", emoji: "🍔", category: "复合食品", description: "营养组成取决于肉饼、酱料和配菜，注意整体份量及搭配。", kcal: 295, protein: 17.0, carbs: 24.0, fat: 14.0, fiber: 1.3, sugar: 4.2, sodium: 414, tags: "快餐 汉堡 肉类 高能量" },
  fries: { name: "薯条", emoji: "🍟", category: "零食及快餐", description: "油炸后能量和脂肪较高，也可能含较多盐，适合控制频率和份量。", kcal: 312, protein: 3.4, carbs: 41.0, fat: 15.0, fiber: 3.8, sugar: 0.3, sodium: 210, tags: "快餐 薯条 油炸 土豆" },
  cake: { name: "蛋糕", emoji: "🍰", category: "甜点", description: "通常含较多精制糖和脂肪，可作为偶尔享用的甜点。", kcal: 347, protein: 5.0, carbs: 52.0, fat: 14.0, fiber: 0.8, sugar: 35.0, sodium: 260, tags: "甜点 蛋糕 糖 烘焙" },
  icecream: { name: "冰淇淋", emoji: "🍨", category: "甜点", description: "含糖和脂肪较多，建议小份享用并注意全天添加糖摄入。", kcal: 207, protein: 3.5, carbs: 24.0, fat: 11.0, fiber: 0.7, sugar: 21.0, sodium: 80, tags: "甜点 冰淇淋 奶制品 糖" }
};

