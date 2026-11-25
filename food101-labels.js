"use strict";

// Food-101 class order used by torchvision.datasets.Food101 and the ONNX model.
const FOOD101_CLASSES = [
  "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare", "beet_salad", "beignets",
  "bibimbap", "bread_pudding", "breakfast_burrito", "bruschetta", "caesar_salad", "cannoli", "caprese_salad",
  "carrot_cake", "ceviche", "cheesecake", "cheese_plate", "chicken_curry", "chicken_quesadilla", "chicken_wings",
  "chocolate_cake", "chocolate_mousse", "churros", "clam_chowder", "club_sandwich", "crab_cakes", "creme_brulee",
  "croque_madame", "cup_cakes", "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict", "escargots",
  "falafel", "filet_mignon", "fish_and_chips", "foie_gras", "french_fries", "french_onion_soup", "french_toast",
  "fried_calamari", "fried_rice", "frozen_yogurt", "garlic_bread", "gnocchi", "greek_salad",
  "grilled_cheese_sandwich", "grilled_salmon", "guacamole", "gyoza", "hamburger", "hot_and_sour_soup", "hot_dog",
  "huevos_rancheros", "hummus", "ice_cream", "lasagna", "lobster_bisque", "lobster_roll_sandwich",
  "macaroni_and_cheese", "macarons", "miso_soup", "mussels", "nachos", "omelette", "onion_rings", "oysters",
  "pad_thai", "paella", "pancakes", "panna_cotta", "peking_duck", "pho", "pizza", "pork_chop", "poutine",
  "prime_rib", "pulled_pork_sandwich", "ramen", "ravioli", "red_velvet_cake", "risotto", "samosa", "sashimi",
  "scallops", "seaweed_salad", "shrimp_and_grits", "spaghetti_bolognese", "spaghetti_carbonara", "spring_rolls",
  "steak", "strawberry_shortcake", "sushi", "tacos", "takoyaki", "tiramisu", "tuna_tartare", "waffles"
];

const FOOD101_ZH = {
  apple_pie: "苹果派", baby_back_ribs: "烤猪肋排", baklava: "果仁蜜饼", beef_carpaccio: "生牛肉薄片",
  beef_tartare: "牛肉塔塔", beet_salad: "甜菜沙拉", beignets: "法式炸甜饼", bibimbap: "石锅拌饭",
  bread_pudding: "面包布丁", breakfast_burrito: "早餐卷饼", bruschetta: "意式烤面包", caesar_salad: "凯撒沙拉",
  cannoli: "卡诺里卷", caprese_salad: "卡普雷塞沙拉", carrot_cake: "胡萝卜蛋糕", ceviche: "酸橘汁腌鱼",
  cheesecake: "芝士蛋糕", cheese_plate: "奶酪拼盘", chicken_curry: "咖喱鸡", chicken_quesadilla: "鸡肉芝士饼",
  chicken_wings: "鸡翅", chocolate_cake: "巧克力蛋糕", chocolate_mousse: "巧克力慕斯", churros: "吉事果",
  clam_chowder: "蛤蜊浓汤", club_sandwich: "总汇三明治", crab_cakes: "蟹肉饼", creme_brulee: "焦糖布蕾",
  croque_madame: "法式火腿煎蛋三明治", cup_cakes: "杯子蛋糕", deviled_eggs: "魔鬼蛋", donuts: "甜甜圈",
  dumplings: "饺子", edamame: "毛豆", eggs_benedict: "班尼迪克蛋", escargots: "法式蜗牛",
  falafel: "炸鹰嘴豆丸", filet_mignon: "菲力牛排", fish_and_chips: "炸鱼薯条", foie_gras: "鹅肝",
  french_fries: "薯条", french_onion_soup: "法式洋葱汤", french_toast: "法式吐司", fried_calamari: "炸鱿鱼",
  fried_rice: "炒饭", frozen_yogurt: "冻酸奶", garlic_bread: "蒜香面包", gnocchi: "意式面疙瘩",
  greek_salad: "希腊沙拉", grilled_cheese_sandwich: "烤芝士三明治", grilled_salmon: "烤三文鱼",
  guacamole: "鳄梨酱", gyoza: "日式煎饺", hamburger: "汉堡", hot_and_sour_soup: "酸辣汤", hot_dog: "热狗",
  huevos_rancheros: "墨西哥牧场蛋", hummus: "鹰嘴豆泥", ice_cream: "冰淇淋", lasagna: "千层面",
  lobster_bisque: "龙虾浓汤", lobster_roll_sandwich: "龙虾卷", macaroni_and_cheese: "芝士通心粉",
  macarons: "马卡龙", miso_soup: "味噌汤", mussels: "贻贝", nachos: "玉米片", omelette: "煎蛋卷",
  onion_rings: "洋葱圈", oysters: "生蚝", pad_thai: "泰式炒河粉", paella: "西班牙海鲜饭", pancakes: "松饼",
  panna_cotta: "意式奶冻", peking_duck: "北京烤鸭", pho: "越南河粉", pizza: "披萨", pork_chop: "猪排",
  poutine: "肉汁奶酪薯条", prime_rib: "烤肋排", pulled_pork_sandwich: "手撕猪肉三明治", ramen: "拉面",
  ravioli: "意式馄饨", red_velvet_cake: "红丝绒蛋糕", risotto: "意式烩饭", samosa: "咖喱角",
  sashimi: "生鱼片", scallops: "扇贝", seaweed_salad: "海藻沙拉", shrimp_and_grits: "虾仁玉米糊",
  spaghetti_bolognese: "肉酱意面", spaghetti_carbonara: "奶油培根意面", spring_rolls: "春卷", steak: "牛排",
  strawberry_shortcake: "草莓奶油蛋糕", sushi: "寿司", tacos: "塔可", takoyaki: "章鱼烧", tiramisu: "提拉米苏",
  tuna_tartare: "金枪鱼塔塔", waffles: "华夫饼"
};

// The recognition model covers 101 dishes, while the course nutrition library
// contains 22 reference foods. This table links compatible dishes to the
// nearest nutrition reference; unmatched dishes keep their recognition result
// and ask the user to choose a reference category manually.
const FOOD101_TO_NUTRITION = {
  apple_pie: "cake", baklava: "cake", beignets: "cake", bibimbap: "rice", bread_pudding: "bread",
  breakfast_burrito: "bread", bruschetta: "bread", cannoli: "cake", carrot_cake: "cake", ceviche: "fish",
  cheesecake: "cake", cheese_plate: "milk", chicken_curry: "chicken", chicken_quesadilla: "chicken",
  chicken_wings: "chicken", chocolate_cake: "cake", chocolate_mousse: "cake", churros: "cake",
  clam_chowder: "fish", club_sandwich: "bread", crab_cakes: "fish", creme_brulee: "cake",
  croque_madame: "bread", cup_cakes: "cake", deviled_eggs: "egg", donuts: "cake", eggs_benedict: "egg",
  fish_and_chips: "fish", french_fries: "fries", french_toast: "bread", fried_calamari: "fish",
  fried_rice: "rice", frozen_yogurt: "icecream", garlic_bread: "bread", gnocchi: "noodles",
  grilled_cheese_sandwich: "bread", grilled_salmon: "fish", guacamole: "avocado", hamburger: "burger",
  hot_dog: "burger", huevos_rancheros: "egg", ice_cream: "icecream", lasagna: "noodles",
  lobster_bisque: "fish", lobster_roll_sandwich: "bread", macaroni_and_cheese: "noodles", macarons: "cake",
  mussels: "fish", omelette: "egg", onion_rings: "fries", oysters: "fish", pad_thai: "noodles",
  paella: "rice", pancakes: "bread", panna_cotta: "milk", peking_duck: "chicken", pho: "noodles",
  pizza: "pizza", poutine: "fries", pulled_pork_sandwich: "bread", ramen: "noodles", ravioli: "noodles",
  red_velvet_cake: "cake", risotto: "rice", samosa: "bread", sashimi: "fish", scallops: "fish",
  shrimp_and_grits: "fish", spaghetti_bolognese: "noodles", spaghetti_carbonara: "noodles",
  strawberry_shortcake: "cake", sushi: "fish", takoyaki: "fish", tiramisu: "cake", tuna_tartare: "fish",
  waffles: "bread"
};
