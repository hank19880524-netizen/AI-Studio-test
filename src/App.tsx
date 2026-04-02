/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Layers, 
  Droplets, 
  Package, 
  Plus, 
  Trash2, 
  Info,
  ChevronRight,
  Home,
  Settings,
  DollarSign,
  LayoutGrid,
  FileText,
  Database,
  X,
  Square,
  Check,
  Edit2,
  GripVertical,
  ChevronDown,
  Printer,
  AlertCircle,
  Folder,
  FilePlus,
  Save,
  ArrowLeft,
  Calendar,
  User,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// --- Types ---
type SpaceType = string;

interface EstimationItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  category: string;
  brand?: string;
  size?: string;
  remarks?: string;
  hiddenInSummary?: boolean;
  tileType?: 'floor' | 'wall';
}

interface Opening {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'door' | 'window' | 'other';
}

interface AreaSegment {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  area: number;
}

interface Space {
  id: string;
  name: string;
  type: SpaceType;
  segments: AreaSegment[];
  openings: Opening[];
  coefficientSetId: string;
  items: EstimationItem[];
}

interface CoefficientSet {
  id: string;
  name: string;
  floorThickness: number;
  wallThickness: number;
  cementPerM2: number;
  sandPerM2: number;
  paintPerM2: number;
  cementLossRate: number;
  sandLossRate: number;
  tileLossRate: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  updatedAt: number;
  totalAmount: number;
  data: {
    categories: Record<string, string>;
    globalCementWeight: number;
    globalPaintCoats?: number; // 全域油漆度數
    quoteDetails: { client: string; project: string; tax: number; };
    spaces: Space[];
    coefficientSets: CoefficientSet[];
    databaseItems: EstimationItem[];
  }
}

const PING_CONVERSION = 0.3025;

const INITIAL_CATEGORIES: Record<string, string> = {
  kitchen_equipment: '廚房設備',
  bath_equipment: '衛浴設備',
  equipment: '一般設備',
  tile: '磁磚類',
  material: '建築材料類',
  waterproof: '防水類',
  waste: '建築廢棄物類',
  labor: '工資類'
};

const DATABASE_ITEMS: Omit<EstimationItem, 'id' | 'quantity'>[] = [
  // 材料
  { name: '水泥', unit: '包', price: 250, category: 'material', remarks: '' },
  { name: '砂', unit: 'm³', price: 1500, category: 'material', remarks: '' },
  { name: '紅磚', unit: '塊', price: 3.5, category: 'material', remarks: '' },
  { name: '益膠泥', unit: '包', price: 450, category: 'material', remarks: '' },
  { name: '填縫劑', unit: '包', price: 350, category: 'material', remarks: '' },
  { name: '油漆', unit: '加侖', price: 1200, category: 'material', remarks: '' },
  // 防水類
  { name: '角防水塗料', unit: '坪', price: 800, category: 'waterproof', remarks: '' },
  { name: '隅抗裂網', unit: '公尺', price: 80, category: 'waterproof', remarks: '' },
  { name: 'PU 防水材', unit: '坪', price: 2000, category: 'waterproof', remarks: '' },
  { name: '撒砂/介面劑', unit: '坪', price: 450, category: 'waterproof', remarks: '' },
  { name: '彈性水泥', unit: '坪', price: 1200, category: 'waterproof', remarks: '' },
  // 磁磚類
  { name: '拋光石英磚', size: '80x80', unit: '片', price: 600, category: 'tile', tileType: 'floor', remarks: '' },
  { name: '木紋磚', size: '15x90', unit: '片', price: 150, category: 'tile', tileType: 'floor', remarks: '' },
  { name: '馬賽克磚', size: '30x30', unit: '片', price: 100, category: 'tile', tileType: 'wall', remarks: '' },
  { name: '地磚', size: '60x60', unit: '片', price: 300, category: 'tile', tileType: 'floor', remarks: '' },
  { name: '壁磚', size: '30x60', unit: '片', price: 150, category: 'tile', tileType: 'wall', remarks: '' },
  // 板材
  { name: '木心板', unit: '片', price: 1200, category: 'material', remarks: '' },
  { name: '角材', unit: '支', price: 150, category: 'material', remarks: '' },
  { name: '石膏板', unit: '片', price: 300, category: 'material', remarks: '' },
  { name: '矽酸鈣板', unit: '片', price: 400, category: 'material', remarks: '' },
  // 廚房設備
  { name: '抽油煙機', unit: '台', price: 8500, category: 'kitchen_equipment', brand: '預設品牌', remarks: '' },
  { name: '瓦斯爐', unit: '台', price: 6500, category: 'kitchen_equipment', brand: '預設品牌', remarks: '' },
  { name: '水槽', unit: '組', price: 4500, category: 'kitchen_equipment', brand: '預設品牌', remarks: '' },
  { name: '洗碗機', unit: '台', price: 25000, category: 'kitchen_equipment', brand: '預設品牌', remarks: '' },
  { name: '冰箱', unit: '台', price: 35000, category: 'kitchen_equipment', brand: '預設品牌', remarks: '' },
  // 衛浴設備
  { name: '馬桶', unit: '組', price: 12000, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '免治馬桶', unit: '組', price: 25000, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '面盆', unit: '組', price: 5500, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '雙面盆', unit: '組', price: 12000, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '花灑龍頭', unit: '組', price: 4500, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '恆溫花灑', unit: '組', price: 8500, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '浴缸', unit: '組', price: 15000, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  { name: '暖風機', unit: '台', price: 6000, category: 'bath_equipment', brand: '預設品牌', remarks: '' },
  // 一般設備
  { name: '冷氣主機', unit: '台', price: 35000, category: 'equipment', brand: '預設品牌', remarks: '' },
  { name: '冷氣室內機', unit: '台', price: 15000, category: 'equipment', brand: '預設品牌', remarks: '' },
  { name: '除濕機', unit: '台', price: 12000, category: 'equipment', brand: '預設品牌', remarks: '' },
  { name: '空氣清淨機', unit: '台', price: 18000, category: 'equipment', brand: '預設品牌', remarks: '' },
  // 廢棄物
  { name: '建築廢棄物清運', unit: '車', price: 4500, category: 'waste', remarks: '' },
  { name: '廢木材清運', unit: '車', price: 3500, category: 'waste', remarks: '' },
  // 工資
  { name: '泥作工資', unit: '工', price: 3500, category: 'labor', remarks: '' },
  { name: '水電工資', unit: '工', price: 3000, category: 'labor', remarks: '' },
  { name: '拆除工資', unit: '工', price: 2800, category: 'labor', remarks: '' },
  { name: '貼磚工資', unit: '坪', price: 2500, category: 'labor', remarks: '' },
  { name: '防水工資', unit: '坪', price: 1500, category: 'labor', remarks: '' },
];

const SPACE_TYPE_LABELS: Record<string, string> = {
  entryway: '玄關', living: '客廳', dining: '餐廳', kitchen: '廚房', family: '起居室',
  multipurpose: '和室 / 多功能室', master_bedroom: '主臥室', kids_room: '小孩房',
  second_bedroom: '次臥室', guest_room: '客房', elderly_room: '孝親房', study: '書房 / 工作室',
  closet: '更衣室', bathroom: '衛浴', storage: '儲藏室', laundry: '洗衣間',
  service_balcony: '工作陽台', corridor: '走廊', balcony: '陽台', terrace: '露台',
  garage: '車庫', stairwell: '樓梯間', attic: '閣樓', other: '其他'
};

const EQUIPMENT_OPTIONS: Record<string, string[]> = {
  entryway: ['感應燈', '鞋櫃', '掛鉤'],
  living: ['空調', '電視', '音響', '除濕機', '吊扇'],
  dining: ['吊燈', '餐櫃', '飲水機'],
  kitchen: ['抽油煙機', '瓦斯爐', '水槽', '洗碗機', '冰箱', '烤箱', '微波爐', '淨水器'],
  family: ['投影機', '空調', '懶骨頭'],
  multipurpose: ['升降桌', '收納櫃', '空調'],
  master_bedroom: ['空調', '電視', '床頭燈', '空氣清淨機'],
  kids_room: ['空調', '書桌燈', '收納架'],
  second_bedroom: ['空調', '書桌燈'],
  guest_room: ['空調', '照明'],
  elderly_room: ['空調', '緊急呼叫鈴', '床頭燈'],
  study: ['書桌燈', '空調', '電腦設備'],
  closet: ['除濕機', '照明', '全身鏡'],
  bathroom: ['馬桶', '免治馬桶', '面盆', '花灑龍頭', '恆溫花灑', '浴缸', '暖風機', '化妝鏡', '淋浴拉門'],
  storage: ['層架', '照明'],
  laundry: ['洗衣機', '烘衣機', '手洗槽'],
  service_balcony: ['熱水器', '升降曬衣架', '洗衣機'],
  corridor: ['壁燈', '感應燈'],
  balcony: ['戶外燈', '休閒椅'],
  terrace: ['戶外燈', '遮陽傘', '園藝設備'],
  garage: ['電動捲門', '充電樁', '工具櫃'],
  stairwell: ['扶手燈', '感應燈'],
  attic: ['空調', '照明', '收納櫃'],
  other: ['通用設備']
};

const DEFAULT_ITEMS_BY_TYPE: Record<SpaceType, EstimationItem[]> = {
  bathroom: [
    { id: 'b1', name: '馬桶', unit: '組', price: 12000, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 'b2', name: '面盆', unit: '組', price: 5500, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 'b3', name: '花灑龍頭', unit: '組', price: 4500, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 't1', name: '地磚', size: '30x30', unit: '片', price: 80, quantity: 0, category: 'tile', tileType: 'floor' },
    { id: 't2', name: '壁磚', size: '30x60', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'wall' },
    { id: 'w1', name: '彈性水泥', unit: '坪', price: 1200, quantity: 1, category: 'waterproof' },
  ],
  master_bath: [
    { id: 'b1', name: '免治馬桶', unit: '組', price: 25000, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 'b2', name: '雙面盆', unit: '組', price: 12000, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 'b3', name: '恆溫花灑', unit: '組', price: 8500, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 'b4', name: '暖風機', unit: '台', price: 6000, quantity: 1, category: 'bath_equipment', brand: '預設品牌' },
    { id: 't1', name: '地磚', size: '30x30', unit: '片', price: 80, quantity: 0, category: 'tile', tileType: 'floor' },
    { id: 't2', name: '壁磚', size: '30x60', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'wall' },
    { id: 'w1', name: '彈性水泥', unit: '坪', price: 1200, quantity: 1, category: 'waterproof' },
  ],
  kitchen: [
    { id: 'k1', name: '抽油煙機', unit: '台', price: 8500, quantity: 1, category: 'kitchen_equipment', brand: '預設品牌' },
    { id: 'k2', name: '瓦斯爐', unit: '台', price: 6500, quantity: 1, category: 'kitchen_equipment', brand: '預設品牌' },
    { id: 'k3', name: '水槽', unit: '組', price: 4500, quantity: 1, category: 'kitchen_equipment', brand: '預設品牌' },
    { id: 't1', name: '地磚', size: '60x60', unit: '片', price: 300, quantity: 0, category: 'tile', tileType: 'floor' },
    { id: 't2', name: '壁磚', size: '30x60', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'wall' },
  ],
  living: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '拋光石英磚', size: '80x80', unit: '片', price: 600, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  master_bedroom: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  kids_room: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  second_bedroom: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  guest_room: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  elderly_room: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  study: [
    { id: 'e1', name: '冷氣室內機', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '木紋磚', size: '15x90', unit: '片', price: 150, quantity: 0, category: 'tile', tileType: 'floor' },
  ],
  balcony: [
    { id: 't1', name: '地磚', size: '30x30', unit: '片', price: 80, quantity: 0, category: 'tile', tileType: 'floor' },
    { id: 'w1', name: 'PU 防水材', unit: '坪', price: 2000, quantity: 1, category: 'waterproof' },
  ],
  service_balcony: [
    { id: 'e1', name: '熱水器', unit: '台', price: 15000, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 'e2', name: '升降曬衣架', unit: '組', price: 6500, quantity: 1, category: 'equipment', brand: '預設品牌' },
    { id: 't1', name: '地磚', size: '30x30', unit: '片', price: 80, quantity: 0, category: 'tile', tileType: 'floor' },
    { id: 'w1', name: 'PU 防水材', unit: '坪', price: 2000, quantity: 1, category: 'waterproof' },
  ],
  other: [
    { id: 't1', name: '地磚', size: '60x60', unit: '片', price: 300, quantity: 0, category: 'tile', tileType: 'floor' },
  ]
};

// --- Factory Functions for Defaults ---
const createDefaultSpaces = (): Space[] => ([{
  id: 'initial-space',
  name: '主衛浴',
  type: 'master_bath',
  segments: [{ id: Math.random().toString(36).substr(2, 9), name: '主要空間', length: 3, width: 2.5, height: 2.4, area: 7.5 }],
  openings: [{ id: 'op-1', name: '門', width: 0.8, height: 2.0, type: 'door' }],
  coefficientSetId: 'default-set',
  items: (DEFAULT_ITEMS_BY_TYPE['master_bath'] || DEFAULT_ITEMS_BY_TYPE['other']).map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
}]);

const createDefaultCoefficientSets = (): CoefficientSet[] => ([{
  id: 'default-set',
  name: '預設係數',
  floorThickness: 4,
  wallThickness: 2,
  cementPerM2: 0.45,
  sandPerM2: 0.055,
  paintPerM2: 0.08, 
  cementLossRate: 10,
  sandLossRate: 10,
  tileLossRate: 10,
}]);

const createDefaultDatabase = (): EstimationItem[] => 
  DATABASE_ITEMS.map((item, idx) => ({ ...item, id: `db-${idx}`, quantity: 1 }));

export default function App() {
  // --- Project Management State ---
  const [appState, setAppState] = useState<'home' | 'editor'>('home');
  const [projectsList, setProjectsList] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('estimation_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);

  // --- Editor State ---
  const [categories, setCategories] = useState<Record<string, string>>(INITIAL_CATEGORIES);
  const [globalCementWeight, setGlobalCementWeight] = useState<number>(50);
  const [globalPaintCoats, setGlobalPaintCoats] = useState<number>(2);
  const [quoteDetails, setQuoteDetails] = useState({ 
    client: '', 
    project: '室內裝修工程', 
    tax: 0,
    markup: 0, // 新增：管理費/利潤比例 (%)
    companyName: '您的室內設計工作室',
    companyPhone: '02-1234-5678',
    companyEmail: 'service@example.com',
    companyAddress: '台北市信義區某某路 123 號'
  });
  const [spaces, setSpaces] = useState<Space[]>(createDefaultSpaces());
  const [coefficientSets, setCoefficientSets] = useState<CoefficientSet[]>(createDefaultCoefficientSets());
  const [databaseItems, setDatabaseItems] = useState<EstimationItem[]>(createDefaultDatabase());
  
  const [activeSpaceId, setActiveSpaceId] = useState<string>('initial-space');
  const [viewMode, setViewMode] = useState<'dashboard' | 'detail' | 'summary' | 'database' | 'calculation' | 'space_management'>('dashboard');
  const [summaryViewMode, setSummaryViewMode] = useState<'category' | 'detail'>('detail');
  
  // UI 狀態控制
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [editingDbId, setEditingDbId] = useState<string | null>(null);
  const [editingCoefficientId, setEditingCoefficientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [isEditingOpenings, setIsEditingOpenings] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, label: string} | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(INITIAL_CATEGORIES).forEach(cat => initial[cat] = false);
    return initial;
  });

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<{id: string, name: string} | null>(null);
  const [dbSearchTerm, setDbSearchTerm] = useState(''); // 新增：資料庫搜尋關鍵字
  const [showUnitConverter, setShowUnitConverter] = useState(false); // 新增：換算工具顯示開關
  const [activeConverterTab, setActiveConverterTab] = useState<'area' | 'length' | 'volume'>('area'); // 新增：換算工具當前分頁

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // --- Auto Save Effect ---
  useEffect(() => {
    if (appState === 'editor' && currentProjectId) {
      const timer = setTimeout(() => {
        saveCurrentProject(false);
      }, 2000); // 停止輸入 2 秒後自動儲存
      return () => clearTimeout(timer);
    }
  }, [spaces, coefficientSets, databaseItems, quoteDetails, categories, globalCementWeight, globalPaintCoats]);

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectsList));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `估算系統備份_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setAlertMessage('備份檔已成功匯出！');
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedProjects = JSON.parse(content);
        
        if (!Array.isArray(importedProjects)) {
          throw new Error("格式錯誤");
        }

        // 重新產生 ID 避免覆蓋現有專案，並標示為匯入
        const newProjects = importedProjects.map(p => ({
          ...p,
          id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));

        const updatedList = [...newProjects, ...projectsList];
        saveProjectsToLocal(updatedList);
        setAlertMessage(`成功匯入 ${newProjects.length} 個專案！`);
      } catch (error) {
        setAlertMessage('匯入失敗：檔案格式不正確或已損毀。');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- Project Actions ---
  const saveProjectsToLocal = (updatedProjects: Project[]) => {
    setProjectsList(updatedProjects);
    localStorage.setItem('estimation_projects', JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    const defaultSpaces = createDefaultSpaces();
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: newProjName || '未命名專案',
      client: newProjClient || '',
      updatedAt: Date.now(),
      totalAmount: 0, // initial
      data: {
        categories: INITIAL_CATEGORIES,
        globalCementWeight: 50,
        globalPaintCoats: 2, 
        quoteDetails: { client: newProjClient, project: newProjName || '未命名專案', tax: 0 },
        spaces: defaultSpaces,
        coefficientSets: createDefaultCoefficientSets(),
        databaseItems: createDefaultDatabase()
      }
    };
    saveProjectsToLocal([newProject, ...projectsList]);
    setShowNewProjectModal(false);
    setNewProjName('');
    setNewProjClient('');
    openProject(newProject);
  };

  const openProject = (project: Project) => {
    setCategories(project.data.categories || INITIAL_CATEGORIES);
    setGlobalCementWeight(project.data.globalCementWeight || 50);
    setGlobalPaintCoats(project.data.globalPaintCoats || 2);
    setQuoteDetails(project.data.quoteDetails || { client: project.client, project: project.name, tax: 0 });
    setSpaces(project.data.spaces || createDefaultSpaces());
    setCoefficientSets(project.data.coefficientSets || createDefaultCoefficientSets());
    setDatabaseItems(project.data.databaseItems || createDefaultDatabase());
    
    if (project.data.spaces && project.data.spaces.length > 0) {
      setActiveSpaceId(project.data.spaces[0].id);
    }
    setCurrentProjectId(project.id);
    setAppState('editor');
    setViewMode('dashboard');
  };

  const saveCurrentProject = (showNotify = true) => {
    if (!currentProjectId) return;
    const currentTotal = spaces.reduce((sum, space) => sum + space.items.filter(i => !i.hiddenInSummary).reduce((iSum, item) => iSum + item.price * item.quantity, 0), 0);
    
    const updatedProjects = projectsList.map(p => {
      if (p.id === currentProjectId) {
        return {
          ...p,
          updatedAt: Date.now(),
          totalAmount: currentTotal,
          client: quoteDetails.client, 
          name: quoteDetails.project,  
          data: {
            categories,
            globalCementWeight,
            globalPaintCoats,
            quoteDetails,
            spaces,
            coefficientSets,
            databaseItems
          }
        };
      }
      return p;
    });
    saveProjectsToLocal(updatedProjects);
    if (showNotify) setAlertMessage('專案已成功儲存！');
  };

  const deleteProject = () => {
    if (!projectToDelete) return;
    const updated = projectsList.filter(p => p.id !== projectToDelete.id);
    saveProjectsToLocal(updated);
    setProjectToDelete(null);
  };

  const returnToHome = () => {
    saveCurrentProject(false); 
    setAppState('home');
    setCurrentProjectId(null);
  };


  // --- Editor Logic ---
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleCementWeightChange = (newWeight: number) => {
    const ratio = globalCementWeight / newWeight; 
    setCoefficientSets(sets => sets.map(set => ({
      ...set,
      cementPerM2: Number((set.cementPerM2 * ratio).toFixed(4))
    })));
    setGlobalCementWeight(newWeight);
  };

  const handlePaintCoatsChange = (newCoats: number) => {
    const ratio = newCoats / globalPaintCoats;
    setCoefficientSets(sets => sets.map(set => ({
      ...set,
      paintPerM2: Number(((set.paintPerM2 || 0.08) * ratio).toFixed(4))
    })));
    setGlobalPaintCoats(newCoats);
  };

  const activeSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];

  const floorAreaM2 = activeSpace ? activeSpace.segments.reduce((sum, seg) => sum + (seg.length * seg.width), 0) : 0;
  const totalOpeningArea = activeSpace ? activeSpace.openings.reduce((sum, o) => sum + (o.width * o.height), 0) : 0;
  const wallAreaM2 = activeSpace ? Math.max(0, activeSpace.segments.reduce((sum, seg) => sum + (2 * (seg.length + seg.width) * seg.height), 0) - totalOpeningArea) : 0;
  
  const floorPing = floorAreaM2 * PING_CONVERSION;
  const wallPing = wallAreaM2 * PING_CONVERSION;

  useEffect(() => {
    if (appState !== 'editor') return; 
    setSpaces(prev => prev.map(space => {
      const coeffSet = coefficientSets.find(cs => cs.id === space.coefficientSetId) || coefficientSets[0];
      if (!coeffSet) return space;

      const fArea = space.segments.reduce((sum, seg) => sum + seg.area, 0);
      const tOpeningArea = space.openings.reduce((sum, o) => sum + (o.width * o.height), 0);
      const wArea = Math.max(0, space.segments.reduce((sum, seg) => sum + (2 * (seg.length + seg.width) * seg.height), 0) - tOpeningArea);
      
      const cementLossMultiplier = 1 + (coeffSet.cementLossRate ?? 10) / 100;
      const sandLossMultiplier = 1 + (coeffSet.sandLossRate ?? 10) / 100;
      const tileLossMultiplier = 1 + (coeffSet.tileLossRate ?? 10) / 100;

      const fThick = coeffSet.floorThickness ?? 5;
      const wThick = coeffSet.wallThickness ?? 5;

      const cementQtyFloor = fArea * coeffSet.cementPerM2 * (fThick / 5) * cementLossMultiplier;
      const cementQtyWall = wArea * coeffSet.cementPerM2 * (wThick / 5) * cementLossMultiplier;
      const cementQty = Math.round(cementQtyFloor + cementQtyWall);

      const sandQtyFloor = fArea * coeffSet.sandPerM2 * (fThick / 5) * sandLossMultiplier;
      const sandQtyWall = wArea * coeffSet.sandPerM2 * (wThick / 5) * sandLossMultiplier;
      const sandQty = Number((sandQtyFloor + sandQtyWall).toFixed(2));
      
      // 油漆根據面積及設定值計算，無額外損耗
      const paintQty = Number((wArea * (coeffSet.paintPerM2 || 0.08)).toFixed(1));
      
      let updatedItems = [...space.items];
      
      const updateOrAddItem = (name: string, category: EstimationItem['category'], qty: number, unit: string, defaultPrice: number) => {
        const index = updatedItems.findIndex(i => i.name === name);
        if (index > -1) {
          updatedItems[index] = { ...updatedItems[index], quantity: qty };
        } else {
          updatedItems.push({ id: Math.random().toString(36).substr(2, 9), name, category, quantity: qty, unit, price: defaultPrice });
        }
      };

      const getTileAreaM2 = (name: string, size?: string) => {
        const match = (size || name).match(/(\d+)\s*[xX*]\s*(\d+)/);
        if (match) return (Number(match[1]) / 100) * (Number(match[2]) / 100);
        return 0.36; 
      };

      updatedItems = updatedItems.map(item => {
        if (item.category === 'tile') {
          const tileArea = getTileAreaM2(item.name, item.size);
          const isWallTile = item.tileType === 'wall' || (!item.tileType && item.name.includes('壁'));
          const targetArea = isWallTile ? wArea : fArea;
          const pieces = targetArea > 0 ? Math.ceil((targetArea / tileArea) * tileLossMultiplier) : 0;
          return { ...item, quantity: pieces, unit: '片' };
        }
        return item;
      });

      updateOrAddItem('水泥', 'material', cementQty, '包', 250);
      updateOrAddItem('砂', 'material', sandQty, 'm³', 1500);
      updateOrAddItem('油漆', 'material', paintQty, '加侖', 1200);

      return { ...space, items: updatedItems };
    }));
  }, [
    JSON.stringify(spaces.map(s => ({ segments: s.segments, openings: s.openings, coefficientSetId: s.coefficientSetId }))),
    JSON.stringify(coefficientSets),
    globalCementWeight,
    globalPaintCoats,
    appState
  ]);

  const activeSpaceTotal = activeSpace ? activeSpace.items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  const globalTotal = spaces.reduce((sum, space) => sum + space.items.filter(i => !i.hiddenInSummary).reduce((iSum, item) => iSum + item.price * item.quantity, 0), 0);
  
  // --- Chart Data Preparation ---
  const chartCategoryData = Object.entries(categories).map(([cat, label]) => {
    const total = spaces.reduce((sum, s) => sum + s.items.filter(i => i.category === cat && !i.hiddenInSummary).reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
    return { name: label, value: total };
  }).filter(item => item.value > 0);

  const chartSpaceData = spaces.map(s => {
    const total = s.items.filter(i => !i.hiddenInSummary).reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { name: s.name, value: total };
  }).filter(item => item.value > 0);

  const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9'];

  const addSpace = (type: SpaceType = 'other') => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newSpace: Space = {
      id: newId,
      name: `新${SPACE_TYPE_LABELS[type] || '空間'} ${spaces.length + 1}`,
      type,
      segments: [{ id: Math.random().toString(36).substr(2, 9), name: '主要空間', length: 3, width: 2.5, height: 2.4, area: 7.5 }],
      openings: [{ id: Math.random().toString(36).substr(2, 9), name: '門', width: 0.8, height: 2.0, type: 'door' }],
      coefficientSetId: 'default-set',
      items: (DEFAULT_ITEMS_BY_TYPE[type] || DEFAULT_ITEMS_BY_TYPE['other']).map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) })),
    };
    setSpaces([...spaces, newSpace]);
    setActiveSpaceId(newId);
    setViewMode('space_management'); 
  };

  const changeSpaceType = (newType: SpaceType) => {
    const defaultItems = DEFAULT_ITEMS_BY_TYPE[newType] || DEFAULT_ITEMS_BY_TYPE['other'];
    setSpaces(spaces.map(s => s.id === activeSpaceId ? {
      ...s,
      type: newType,
      name: `${SPACE_TYPE_LABELS[newType]} ${spaces.findIndex(x => x.id === activeSpaceId) + 1}`,
      items: defaultItems.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }))
    } : s));
  };

  const addSegment = () => {
    const newSegment: AreaSegment = { id: Math.random().toString(36).substr(2, 9), name: `區塊 ${activeSpace.segments.length + 1}`, length: 3, width: 2.5, height: 2.4, area: 7.5 };
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, segments: [...s.segments, newSegment] } : s));
  };

  const removeSegment = (segmentId: string) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, segments: s.segments.filter(seg => seg.id !== segmentId) } : s));
  };

  const updateSegment = (segmentId: string, field: keyof AreaSegment, value: string | number) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? {
      ...s,
      segments: s.segments.map(seg => {
        if (seg.id === segmentId) {
          const updated = { ...seg, [field]: value };
          if (field === 'length' || field === 'width') updated.area = updated.length * updated.width;
          if (field === 'area') {
            const side = Math.sqrt(Number(value));
            updated.length = side;
            updated.width = side;
          }
          return updated;
        }
        return seg;
      })
    } : s));
  };

  const addOpening = () => {
    const newOpening: Opening = { id: Math.random().toString(36).substr(2, 9), name: '開口', width: 1.0, height: 1.0, type: 'other' };
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, openings: [...s.openings, newOpening] } : s));
  };

  const removeOpening = (openingId: string) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, openings: s.openings.filter(o => o.id !== openingId) } : s));
  };

  const updateOpening = (openingId: string, field: keyof Opening, value: string | number) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? {
      ...s,
      openings: s.openings.map(o => o.id === openingId ? { ...o, [field]: value } : o)
    } : s));
  };

  const confirmRemoveSpace = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (spaces.length === 1) {
      setAlertMessage('無法刪除。專案至少需要保留一個空間設定。');
      return;
    }
    setSpaceToDelete({ id, name });
  };

  const executeRemoveSpace = () => {
    if (!spaceToDelete) return;
    const newSpaces = spaces.filter(s => s.id !== spaceToDelete.id);
    setSpaces(newSpaces);
    if (activeSpaceId === spaceToDelete.id) {
      setActiveSpaceId(newSpaces[0].id);
    }
    setSpaceToDelete(null);
  };

  const updateSpaceField = (field: keyof Space, value: any) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, [field]: value } : s));
  };

  const addFromDatabase = (item: Omit<EstimationItem, 'id' | 'quantity'>) => {
    const newItem: EstimationItem = { ...item, id: Math.random().toString(36).substr(2, 9), quantity: 1 };
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, items: [...s.items, newItem] } : s));
    setShowDatabaseModal(false);
  };

  const addDatabaseItem = (category: EstimationItem['category']) => {
    const newItem: EstimationItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新項目', unit: '件', price: 0, quantity: 1, category, brand: '', remarks: '', size: '',
      tileType: category === 'tile' ? 'floor' : undefined
    };
    setDatabaseItems([...databaseItems, newItem]);
  };

  const updateDatabaseItem = (id: string, field: keyof EstimationItem, value: any) => {
    setDatabaseItems(databaseItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeDatabaseItem = (id: string) => {
    setDatabaseItems(databaseItems.filter(i => i.id !== id));
  };

  const reorderDatabaseItems = (newItems: EstimationItem[], category: string) => {
    const otherItems = databaseItems.filter(i => i.category !== category);
    setDatabaseItems([...otherItems, ...newItems]);
    setSortBy(null); 
  };

  const removeItem = (itemId: string) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s));
  };

  const updateItem = (itemId: string, field: keyof EstimationItem, value: string | number) => {
    setSpaces(spaces.map(s => s.id === activeSpaceId ? { 
      ...s, 
      items: s.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) 
    } : s));
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertMessage('無法開啟新視窗。請檢查您的瀏覽器是否阻擋了彈出視窗（Pop-up blocker）。');
      return;
    }

    const markupAmount = Math.round(globalTotal * (quoteDetails.markup / 100));
    const subtotalWithMarkup = globalTotal + markupAmount;
    const taxAmount = Math.round(subtotalWithMarkup * (quoteDetails.tax / 100));
    const totalWithTax = subtotalWithMarkup + taxAmount;

    // --- Summary by Category for PDF ---
    const categorySummaryHTML = Object.entries(categories).map(([cat, label]) => {
      const total = spaces.reduce((sum, s) => sum + s.items.filter(i => i.category === cat && !i.hiddenInSummary).reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
      if (total === 0) return '';
      return `
        <tr class="border-b border-slate-200">
          <td class="py-2 px-3 text-slate-700 font-medium">${label}</td>
          <td class="py-2 px-3 text-right font-mono text-slate-900">NT$ ${total.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const rowsHTML = spaces.map((space, sIndex) => {
      const visibleItems = space.items.filter(i => !i.hiddenInSummary);
      if (visibleItems.length === 0) return '';
      const spaceTotal = visibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      let html = `
        <tr class="bg-slate-100 font-bold border-b-2 border-slate-300">
          <td class="border border-slate-300 px-3 py-2 text-center">${sIndex + 1}</td>
          <td class="border border-slate-300 px-3 py-2 text-blue-900" colspan="6">${space.name}</td>
        </tr>
      `;
      visibleItems.forEach((item, iIndex) => {
        html += `
          <tr style="page-break-inside: avoid;" class="hover:bg-slate-50">
            <td class="border border-slate-300 px-3 py-1.5 text-center text-slate-500 text-xs">${sIndex + 1}-${iIndex + 1}</td>
            <td class="border border-slate-300 px-3 py-1.5 font-medium text-slate-800">
              ${item.name} 
              ${item.brand ? `<span class="text-[10px] text-slate-500 bg-slate-100 px-1 rounded ml-1 border border-slate-200">${item.brand}</span>` : ''} 
              ${item.size ? `<span class="text-[10px] text-blue-600 bg-blue-50 px-1 rounded ml-1 border border-blue-100">${item.size}</span>` : ''}
            </td>
            <td class="border border-slate-300 px-3 py-1.5 text-center text-slate-600">${item.unit}</td>
            <td class="border border-slate-300 px-3 py-1.5 text-right text-slate-800 font-mono">${item.quantity}</td>
            <td class="border border-slate-300 px-3 py-1.5 text-right text-slate-600 font-mono">${item.price.toLocaleString()}</td>
            <td class="border border-slate-300 px-3 py-1.5 text-right font-bold text-slate-900 font-mono">${(item.price * item.quantity).toLocaleString()}</td>
            <td class="border border-slate-300 px-3 py-1.5 text-[10px] text-slate-500 leading-tight">${item.remarks || ''}</td>
          </tr>
        `;
      });
      html += `
        <tr style="page-break-inside: avoid;" class="bg-blue-50/50">
          <td class="border border-slate-300 px-3 py-2 text-right font-bold text-slate-600" colspan="5">本區小計</td>
          <td class="border border-slate-300 px-3 py-2 text-right font-bold text-blue-700 font-mono">${spaceTotal.toLocaleString()}</td>
          <td class="border border-slate-300 px-3 py-2"></td>
        </tr>
      `;
      return html;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <title>報價單 - ${quoteDetails.project || '室內裝修工程'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
            @page { margin: 10mm; size: A4 portrait; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
          }
          body { font-family: 'Inter', 'Noto Sans TC', sans-serif; color: #1e293b; background-color: #f1f5f9; }
          .print-container { background-color: white; max-width: 210mm; margin: 0 auto; padding: 15mm; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
          @media print { .print-container { box-shadow: none; padding: 0; max-width: none; } }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); pointer-events: none; z-index: 0; white-space: nowrap; font-weight: 900; }
        </style>
      </head>
      <body class="py-10">
        <div class="text-center mb-8 no-print flex justify-center gap-4">
          <button onclick="window.print()" class="bg-blue-600 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105">列印 / 儲存為 PDF</button>
          <button onclick="window.close()" class="bg-slate-200 text-slate-700 font-bold py-2.5 px-8 rounded-xl hover:bg-slate-300 transition-all">關閉視窗</button>
        </div>

        <div class="print-container relative">
          <div class="watermark uppercase">Quotation</div>
          
          <!-- Header -->
          <div class="flex justify-between items-start mb-10 border-b-4 border-slate-800 pb-8">
            <div class="space-y-2">
              <h1 class="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-4">正式報價單</h1>
              <div class="space-y-1 text-sm text-slate-600">
                <p class="font-bold text-slate-800 text-lg">${quoteDetails.companyName}</p>
                <p>電話：${quoteDetails.companyPhone}</p>
                <p>信箱：${quoteDetails.companyEmail}</p>
                <p>地址：${quoteDetails.companyAddress}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-inner">
                <p class="text-xs font-bold opacity-70 mb-1">報價單編號</p>
                <p class="text-xl font-black font-mono">QT-${new Date().getTime().toString().slice(-8)}</p>
              </div>
              <div class="mt-4 text-sm text-slate-500 space-y-1">
                <p><span class="font-bold">報價日期：</span>${new Date().toLocaleDateString('zh-TW')}</p>
                <p><span class="font-bold">有效期限：</span>報價後 30 天</p>
              </div>
            </div>
          </div>
          
          <!-- Client Info -->
          <div class="grid grid-cols-2 gap-8 mb-10">
            <div class="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <h3 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">客戶資訊</h3>
              <p class="text-lg font-bold text-slate-800 mb-1">${quoteDetails.client || '__________________________'}</p>
              <p class="text-sm text-slate-500">感謝您的諮詢，以下為本次裝修工程之預估報價。</p>
            </div>
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 class="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">專案名稱</h3>
              <p class="text-lg font-bold text-slate-800">${quoteDetails.project || '__________________________'}</p>
            </div>
          </div>

          <!-- Category Summary -->
          <div class="mb-10" style="page-break-inside: avoid;">
            <h3 class="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              工程分類總覽 (Summary)
            </h3>
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-y border-slate-200">
                <tr>
                  <th class="py-2 px-3 text-left font-bold text-slate-500">工程分類</th>
                  <th class="py-2 px-3 text-right font-bold text-slate-500">預估金額 (未稅)</th>
                </tr>
              </thead>
              <tbody>
                ${categorySummaryHTML}
                <tr class="bg-slate-100 font-bold">
                  <td class="py-3 px-3 text-slate-800">小計 (Subtotal)</td>
                  <td class="py-3 px-3 text-right font-mono text-slate-900">NT$ ${globalTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- Details Table -->
          <h3 class="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 mt-8">
            <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            各空間施作明細 (Details)
          </h3>
          <table class="w-full border-collapse border-2 border-slate-400 text-[12px] mb-8 table-fixed shadow-sm">
            <thead>
              <tr class="bg-slate-800 text-white">
                <th class="border border-slate-400 px-2 py-2 text-center w-12 font-semibold">項次</th>
                <th class="border border-slate-400 px-2 py-2 text-left w-auto font-semibold">項目 / 說明</th>
                <th class="border border-slate-400 px-2 py-2 text-center w-14 font-semibold">單位</th>
                <th class="border border-slate-400 px-2 py-2 text-right w-16 font-semibold">數量</th>
                <th class="border border-slate-400 px-2 py-2 text-right w-20 font-semibold">單價</th>
                <th class="border border-slate-400 px-2 py-2 text-right w-24 font-semibold">複價</th>
                <th class="border border-slate-400 px-2 py-2 text-left w-32 font-semibold">備註</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <!-- Totals Section -->
          <div class="flex justify-end mb-12" style="page-break-inside: avoid;">
            <div class="w-80 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
              <div class="flex justify-between py-2 border-b border-slate-700 text-sm opacity-80">
                <span>合計金額：</span>
                <span class="font-mono">NT$ ${globalTotal.toLocaleString()}</span>
              </div>
              ${quoteDetails.markup > 0 ? `
              <div class="flex justify-between py-2 border-b border-slate-700 text-sm opacity-80">
                <span>監工管理費 (${quoteDetails.markup}%)：</span>
                <span class="font-mono">NT$ ${markupAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              ${quoteDetails.tax > 0 ? `
              <div class="flex justify-between py-2 border-b border-slate-700 text-sm opacity-80">
                <span>營業稅 (${quoteDetails.tax}%)：</span>
                <span class="font-mono">NT$ ${taxAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              <div class="flex justify-between py-4 text-2xl font-black mt-2">
                <span>總計：</span>
                <span class="text-blue-400 font-mono">NT$ ${totalWithTax.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Terms & Signature -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16" style="page-break-inside: avoid;">
            <div class="space-y-4">
              <h4 class="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">注意事項 (Terms)</h4>
              <ul class="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>本報價單有效期限為 30 天，逾期請重新諮詢。</li>
                <li>工程款項支付方式：訂金 30%、開工 30%、完工 30%、驗收 10%。</li>
                <li>報價內容不含政府規費、大樓清潔費及保證金。</li>
                <li>施工期間若有追加減項，將另行簽署追加減確認單。</li>
                <li>本工程保固期為完工驗收後一年（非人為因素損壞）。</li>
              </ul>
            </div>
            <div class="flex flex-col justify-between">
              <div class="grid grid-cols-2 gap-8">
                <div class="text-center">
                  <div class="border-b border-slate-300 pb-16 mb-2"></div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">公司簽章 (Company)</p>
                </div>
                <div class="text-center">
                  <div class="border-b border-slate-300 pb-16 mb-2"></div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">客戶確認簽章 (Client)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); }, 800);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderSpaceTabs = () => (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide snap-x">
      {spaces.map(space => (
        <div 
          key={space.id}
          title={space.name}
          onClick={() => setActiveSpaceId(space.id)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all border whitespace-nowrap shrink-0 snap-start ${
            activeSpaceId === space.id 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
            activeSpaceId === space.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {SPACE_TYPE_LABELS[space.type] || '空間'}
          </span>
          <span className="font-semibold text-sm">{space.name}</span>
          <button 
            onClick={(e) => confirmRemoveSpace(space.id, space.name, e)}
            className={`p-1 rounded-md transition-colors ml-1 ${
              activeSpaceId === space.id 
                ? 'hover:bg-white/20 text-white/60 hover:text-white' 
                : 'hover:bg-red-50 text-slate-300 hover:text-red-500'
            }`}
            title="刪除空間"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button 
        onClick={() => addSpace('other')}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 shrink-0 whitespace-nowrap snap-start"
      >
        <Plus size={16} /> <span className="text-sm font-bold">新增空間</span>
      </button>
    </div>
  );

  // --- VIEWS RENDER ---

  if (appState === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md shadow-blue-600/20">
              <Calculator size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">建築內裝估算系統</h1>
              <p className="text-xs font-medium text-slate-500">專業裝修數量預估與報價管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Upload size={18} /> <span className="hidden sm:inline">匯入備份</span>
            </button>
            <button 
              onClick={handleExportBackup} 
              className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Download size={18} /> <span className="hidden sm:inline">匯出備份</span>
            </button>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              <FilePlus size={18} /> <span className="hidden sm:inline">建立新專案</span>
            </button>
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImportBackup} />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Folder size={24} className="text-blue-500" />
              我的專案列表
            </h2>
            <span className="text-sm font-semibold text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full">
              共 {projectsList.length} 個專案
            </span>
          </div>

          {projectsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 mb-6">
                <Folder size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">目前還沒有任何專案</h3>
              <p className="text-slate-500 mb-8 max-w-md">點擊上方按鈕建立您的第一個估算專案，系統將為您自動準備預設的材料資料庫與空間計算公式。</p>
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
              >
                <Plus size={20} /> 立即開始估算
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {projectsList.map(proj => (
                  <motion.div 
                    key={proj.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group"
                    onClick={() => openProject(proj)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setProjectToDelete({ id: proj.id, name: proj.name }); }}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="刪除專案"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{proj.name || '未命名專案'}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-6 truncate">
                      <User size={14} /> {proj.client || '尚未填寫客戶名稱'}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Calendar size={12} /> 最後更新
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {new Date(proj.updatedAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">預估總額</p>
                        <p className="text-base font-black text-blue-600 font-mono">
                          NT$ {proj.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <AnimatePresence>
          {showNewProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewProjectModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 flex flex-col z-10 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl"><FilePlus size={24} /></div>
                    <h3 className="text-xl font-bold text-slate-800">建立新專案</h3>
                  </div>
                  <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">專案名稱</label>
                    <input autoFocus type="text" value={newProjName} onChange={e => setNewProjName(e.target.value)} className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 transition-shadow" placeholder="例如：信義區老屋翻新" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5">客戶名稱 <span className="text-xs font-normal text-slate-400">(選填)</span></label>
                    <input type="text" value={newProjClient} onChange={e => setNewProjClient(e.target.value)} className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 transition-shadow" placeholder="例如：王大明 先生" />
                  </div>
                </div>
                <div className="flex gap-3 mt-auto">
                  <button onClick={() => setShowNewProjectModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">取消</button>
                  <button onClick={handleCreateProject} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-600/20">建立並開始估算</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {projectToDelete && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProjectToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-slate-100 z-10">
                <div className="bg-red-50 text-red-500 p-5 rounded-full mb-5"><Trash2 size={36} /></div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">刪除專案</h3>
                <p className="text-sm font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-lg mb-4">{projectToDelete.name}</p>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">確定要刪除此專案嗎？<br/>所有的估算紀錄將會永久移除，<strong className="text-red-500">且無法復原。</strong></p>
                <div className="flex w-full gap-3">
                  <button onClick={() => setProjectToDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">取消</button>
                  <button onClick={deleteProject} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-red-500/20">確定刪除</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={returnToHome}
            className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-bold text-sm border border-transparent hover:border-blue-100"
          >
            <ArrowLeft size={18} /> 返回列表
          </button>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
              <Calculator size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">{quoteDetails.project || '未命名專案'}</h1>
              <p className="text-[10px] font-medium text-slate-500 leading-tight">{quoteDetails.client}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap justify-end">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 shadow-inner overflow-x-auto hide-scrollbar max-w-[calc(100vw-360px)]">
            <button title="儀表板" onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'dashboard' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><LayoutGrid size={18} /> <span className="hidden lg:inline">儀表板</span></button>
            <button title="空間設定" onClick={() => setViewMode('space_management')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'space_management' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Settings size={18} /> <span className="hidden lg:inline">空間設定</span></button>
            <button title="估價明細" onClick={() => setViewMode('detail')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Layers size={18} /> <span className="hidden lg:inline">估價明細</span></button>
            <button title="換算設定" onClick={() => setViewMode('calculation')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'calculation' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Droplets size={18} /> <span className="hidden lg:inline">換算設定</span></button>
            <button title="資料庫" onClick={() => setViewMode('database')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'database' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><Database size={18} /> <span className="hidden lg:inline">資料庫</span></button>
            <button title="總結報告" onClick={() => setViewMode('summary')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${viewMode === 'summary' ? 'bg-white text-blue-600 shadow-sm border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}><FileText size={18} /> <span className="hidden lg:inline">總結報告</span></button>
          </div>
          <button 
            onClick={() => saveCurrentProject(true)}
            className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <Save size={16} /> 儲存專案
          </button>
        </div>
      </header>

      <div className="flex flex-col relative bg-slate-50">
        <main className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 overflow-y-auto lg:h-[calc(100vh-73px)]">
          
          {viewMode === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">專案空間概覽</h2>
                  <p className="text-sm text-slate-500 mt-1">點擊卡片查看估算明細，或點擊齒輪調整面積設定</p>
                </div>
                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={20} /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">總預算預估</p>
                    <p className="text-xl font-black text-slate-900 font-mono">NT$ {globalTotal.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {spaces.map(space => {
                  const sTotal = space.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                  const sFloorArea = space.segments.reduce((sum, seg) => sum + seg.area, 0);
                  const sOpeningArea = space.openings.reduce((sum, o) => sum + (o.width * o.height), 0);
                  const sWallArea = Math.max(0, space.segments.reduce((sum, seg) => sum + (2 * (seg.length + seg.width) * seg.height), 0) - sOpeningArea);
                  return (
                    <motion.div 
                      key={space.id}
                      whileHover={{ y: -4 }}
                      onClick={() => { setActiveSpaceId(space.id); setViewMode('detail'); }}
                      className="bg-white rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-300 transition-all duration-300 group relative overflow-hidden flex flex-col"
                    >
                      <div className="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-blue-50 transition-colors transform group-hover:scale-110 duration-500 z-0">
                        <Home size={80} strokeWidth={1} />
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); setActiveSpaceId(space.id); setViewMode('space_management'); }}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors z-20"
                        title="編輯空間參數"
                      >
                        <Settings size={20} />
                      </div>
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-5 pr-10">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                            {SPACE_TYPE_LABELS[space.type] || space.type}
                          </span>
                          <h3 className="text-lg font-bold text-slate-800 truncate">{space.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold mb-1">地面面積</p>
                            <p className="text-base font-bold text-slate-700 font-mono">{(sFloorArea * PING_CONVERSION).toFixed(1)} <span className="text-xs font-sans text-slate-400">坪</span></p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-bold mb-1">牆面面積</p>
                            <p className="text-base font-bold text-slate-700 font-mono">{(sWallArea * PING_CONVERSION).toFixed(1)} <span className="text-xs font-sans text-slate-400">坪</span></p>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                        <span className="text-xs font-bold text-slate-400">空間預估</span>
                        <span className="text-lg font-bold text-blue-600 font-mono group-hover:scale-105 transition-transform origin-right">
                          NT$ {sTotal.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                <motion.div 
                  whileHover={{ y: -4 }}
                  onClick={() => addSpace('other')}
                  className="bg-slate-50/50 rounded-2xl p-6 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 min-h-[240px]"
                >
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Plus size={32} /></div>
                  <span className="font-bold text-sm">新增評估空間</span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {viewMode === 'space_management' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">空間參數設定</h2>
                  <p className="text-sm text-slate-500 mt-1">管理所有空間的基本資訊、面積與開口尺寸</p>
                </div>
              </div>
              {renderSpaceTabs()}
              <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                    <Settings size={20} className="text-blue-600" />
                    <span>{activeSpace.name} - 參數設定</span>
                  </div>
                  <button onClick={() => setViewMode('detail')} className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                    前往查看估價明細 <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">空間類型</label>
                    <select value={activeSpace.type ?? ''} onChange={(e) => changeSpaceType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100 cursor-pointer">
                      {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">空間名稱</label>
                    <input type="text" value={activeSpace.name ?? ''} onChange={(e) => updateSpaceField('name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">材料係數套用</label>
                    <select value={activeSpace.coefficientSetId ?? ''} onChange={(e) => updateSpaceField('coefficientSetId', e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-100 cursor-pointer">
                      {coefficientSets.map((set) => (
                        <option key={set.id} value={set.id}>{set.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2"><Square size={16} className="text-blue-500" />空間面積 / 高度分區</label>
                    <button onClick={addSegment} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-xs font-bold flex items-center gap-1">
                      <Plus size={14} /> 新增區塊
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {activeSpace.segments.map((segment) => (
                      <div key={segment.id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <input type="text" value={segment.name ?? ''} disabled={editingSegmentId !== segment.id} onChange={(e) => updateSegment(segment.id, 'name', e.target.value)} className="text-sm font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-0.5 w-32 disabled:border-transparent text-slate-800" placeholder="區塊名稱" />
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingSegmentId(editingSegmentId === segment.id ? null : segment.id)} className={`p-1.5 rounded-md transition-colors ${editingSegmentId === segment.id ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'}`}>
                              {editingSegmentId === segment.id ? <Check size={14}/> : <Edit2 size={14}/>}
                            </button>
                            <button onClick={() => removeSegment(segment.id)} className="bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 p-1.5 rounded-md transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-semibold uppercase">長 (m)</label><input type="number" step="0.1" value={segment.length ?? 0} disabled={editingSegmentId !== segment.id} onChange={(e) => updateSegment(segment.id, 'length', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-semibold uppercase">寬 (m)</label><input type="number" step="0.1" value={segment.width ?? 0} disabled={editingSegmentId !== segment.id} onChange={(e) => updateSegment(segment.id, 'width', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-semibold uppercase">面積 (m²)</label><input type="number" step="0.1" value={segment.area ?? 0} disabled={editingSegmentId !== segment.id} onChange={(e) => updateSegment(segment.id, 'area', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-sm font-mono text-blue-700 font-bold disabled:opacity-60 disabled:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-semibold uppercase">牆高 (m)</label><input type="number" step="0.1" value={segment.height ?? 0} disabled={editingSegmentId !== segment.id} onChange={(e) => updateSegment(segment.id, 'height', Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-sm font-mono text-slate-700 disabled:opacity-60 disabled:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                          <span className="text-[11px] font-mono text-slate-500">地面: <strong className="text-slate-800">{segment.area.toFixed(2)}</strong> m²</span>
                          <span className="text-[11px] font-mono text-slate-500">牆面: <strong className="text-slate-800">{(2 * (segment.length + segment.width) * segment.height).toFixed(2)}</strong> m²</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2"><Square size={16} className="text-blue-500" />門窗 / 開口扣除</label>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setIsEditingOpenings(!isEditingOpenings)} className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-bold ${isEditingOpenings ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{isEditingOpenings ? '完成' : '編輯'}</button>
                      <button onClick={addOpening} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-xs font-bold flex items-center gap-1"><Plus size={14} /> 新增扣除項</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeSpace.openings.map((opening) => (
                      <div key={opening.id} className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <input type="text" value={opening.name ?? ''} disabled={!isEditingOpenings} onChange={(e) => updateOpening(opening.id, 'name', e.target.value)} className="w-14 text-sm font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none px-1 py-1 disabled:border-transparent text-slate-800" placeholder="名稱" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <select value={opening.type ?? 'window'} disabled={!isEditingOpenings} onChange={(e) => updateOpening(opening.id, 'type', e.target.value as 'door' | 'window' | 'other')} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 text-xs disabled:opacity-60 outline-none cursor-pointer">
                              <option value="window">窗</option>
                              <option value="door">門</option>
                              <option value="other" className="font-bold text-slate-700">其他</option>
                            </select>
                            <input type="number" step="0.1" value={opening.width ?? ''} disabled={!isEditingOpenings} onChange={(e) => updateOpening(opening.id, 'width', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-mono disabled:opacity-60 outline-none focus:border-blue-500" placeholder="寬(m)" />
                            <span className="text-slate-400 text-[10px]">x</span>
                            <input type="number" step="0.1" value={opening.height ?? ''} disabled={!isEditingOpenings} onChange={(e) => updateOpening(opening.id, 'height', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-mono disabled:opacity-60 outline-none focus:border-blue-500" placeholder="高(m)" />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 px-1 font-mono mt-1">
                            <span>面積: <strong className="text-slate-700">{(opening.width * opening.height).toFixed(2)}</strong> m²</span>
                            <span>周長: <strong className="text-slate-700">{(opening.type === 'door' ? (opening.width + opening.height * 2) : (opening.width + opening.height) * 2).toFixed(2)}</strong> m</span>
                          </div>
                        </div>
                        <button onClick={() => removeOpening(opening.id)} disabled={!isEditingOpenings} className="text-slate-400 hover:bg-red-50 hover:text-red-500 p-1.5 rounded-md disabled:opacity-0 transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {activeSpace.openings.length === 0 && <div className="col-span-full text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">目前無扣除開口</div>}
                  </div>
                  <div className="mt-6 flex flex-col md:flex-row items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex-1 w-full flex justify-between items-center px-4 md:border-r border-blue-200/50 pb-2 md:pb-0 border-b md:border-b-0">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">實算地面面積</span>
                      <span className="text-base font-mono font-bold text-blue-700">{activeSpace.segments.reduce((sum, seg) => sum + seg.area, 0).toFixed(2)} m²</span>
                    </div>
                    <div className="flex-1 w-full flex justify-between items-center px-4">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">實算牆面面積 (已扣除開口)</span>
                      <span className="text-base font-mono font-bold text-blue-700">
                        {Math.max(0, activeSpace.segments.reduce((sum, seg) => sum + (2 * (seg.length + seg.width) * seg.height), 0) - activeSpace.openings.reduce((sum, o) => sum + (o.width * o.height), 0)).toFixed(2)} m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'detail' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">各區估價明細</h2>
                  <p className="text-sm text-slate-500 mt-1">管理與編修各空間的基礎建材、設備及工資數量</p>
                </div>
              </div>
              {renderSpaceTabs()}
              <div className="w-full flex-1 space-y-6">
                <section className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-900 pointer-events-none"><Square size={80} strokeWidth={1} /></div>
                      <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Layers size={22} /></div><span className="text-sm font-bold text-slate-500">地面面積</span></div></div>
                      <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-black text-slate-800 tracking-tight">{floorAreaM2.toFixed(2)}</span><span className="text-slate-500 font-medium">m²</span></div>
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold"><ChevronRight size={16} /><span className="text-base">{floorPing.toFixed(2)} 坪</span></div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-900 pointer-events-none"><Layers size={80} strokeWidth={1} /></div>
                      <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><Layers size={22} /></div><span className="text-sm font-bold text-slate-500">牆面面積</span></div>{totalOpeningArea > 0 && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold">已扣除開口 {totalOpeningArea.toFixed(2)} m²</span>}</div>
                      <div className="flex items-baseline gap-2 mb-2"><span className="text-4xl font-black text-slate-800 tracking-tight">{wallAreaM2.toFixed(2)}</span><span className="text-slate-500 font-medium">m²</span></div>
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold"><ChevronRight size={16} /><span className="text-base">{wallPing.toFixed(2)} 坪</span></div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 text-base font-bold"><Layers size={18} className="text-blue-500" /><span>基礎建材明細 (磁磚、泥作、油漆等)</span></div>
                    <button onClick={() => setShowDatabaseModal(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors rounded-lg shadow-sm">
                      <Database size={16} /> 從資料庫加入材料
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto pb-2">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap table-fixed min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 w-[35%]">項目 / 品牌 / 規格</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[10%]">單位</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">單價</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">數量</th>
                            <th className="px-4 py-3 font-bold text-slate-500 w-[15%] text-right">小計</th>
                            <th className="px-4 py-3 w-[10%] text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.keys(categories).filter(c => !['kitchen_equipment', 'bath_equipment', 'equipment', 'labor', 'waste'].includes(c)).map(cat => {
                            const catItems = activeSpace.items.filter(i => i.category === cat);
                            if (catItems.length === 0) return null;
                            return (
                              <React.Fragment key={cat}>
                                <tr className="bg-slate-50/50"><td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">▍{categories[cat]}</td></tr>
                                <AnimatePresence initial={false}>
                                    {catItems.map((item) => {
                                      const isEditing = editingItemId === item.id;
                                      return (
                                        <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="hover:bg-slate-50 transition-colors group">
                                          <td className="px-4 py-2.5">
                                            <div className="flex flex-col gap-1 w-full">
                                              {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                  <input type="text" value={item.name ?? ''} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 text-xs" placeholder="項目名稱" />
                                                  {cat === 'tile' && (
                                                    <select value={item.tileType || 'floor'} onChange={(e) => updateItem(item.id, 'tileType', e.target.value as 'floor' | 'wall')} className="w-16 shrink-0 bg-white border border-slate-300 rounded px-1 py-1 text-[11px] text-teal-700 font-bold outline-none focus:ring-1 focus:ring-blue-500">
                                                      <option value="floor">地磚</option>
                                                      <option value="wall">壁磚</option>
                                                    </select>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-800 text-sm truncate">{item.name}</span>
                                                  {cat === 'tile' && item.tileType && (
                                                    <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium border ${item.tileType === 'wall' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                                                      {item.tileType === 'wall' ? '壁磚' : '地磚'}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1.5 mt-0.5 w-full">
                                                {isEditing ? (
                                                  <>
                                                    <input type="text" value={item.brand || ''} onChange={(e) => updateItem(item.id, 'brand', e.target.value)} className="w-16 shrink-0 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="品牌" />
                                                    {cat === 'tile' && <input type="text" value={item.size || ''} onChange={(e) => updateItem(item.id, 'size', e.target.value)} className="w-16 shrink-0 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-blue-600 font-bold outline-none focus:ring-1 focus:ring-blue-500" placeholder="尺寸" />}
                                                    <input type="text" value={item.remarks || ''} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} className="flex-1 w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] italic outline-none focus:ring-1 focus:ring-blue-500" placeholder="備註說明..." />
                                                  </>
                                                ) : (
                                                  <>
                                                    {item.brand && <span className="text-[10px] shrink-0 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]">{item.brand}</span>}
                                                    {cat === 'tile' && item.size && <span className="text-[10px] shrink-0 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100 truncate max-w-[80px]">{item.size}</span>}
                                                    {item.remarks && <span className="text-[10px] text-slate-400 italic truncate w-full flex-1">{item.remarks}</span>}
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            {isEditing ? <input type="text" value={item.unit ?? ''} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="text-slate-600 font-medium">{item.unit}</span>}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            {isEditing ? <input type="number" value={item.price ?? 0} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono text-slate-600">{(item.price).toLocaleString()}</span>}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            {isEditing ? <input type="number" step="0.1" value={item.quantity ?? 0} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{item.quantity}</span>}
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-bold text-blue-600 font-mono text-[13px]">
                                            {(item.price * item.quantity).toLocaleString()}
                                          </td>
                                          <td className="px-4 py-2.5 text-center">
                                            <div className={`flex items-center justify-center gap-1 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                              {isEditing ? (
                                                <>
                                                  <button onClick={() => setEditingItemId(null)} className="text-white bg-green-500 hover:bg-green-600 p-1 rounded transition-colors shadow-sm" title="儲存"><Check size={12} /></button>
                                                  <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="刪除"><Trash2 size={12} /></button>
                                                </>
                                              ) : (
                                                <button onClick={() => setEditingItemId(item.id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="編輯"><Edit2 size={14} /></button>
                                              )}
                                            </div>
                                          </td>
                                        </motion.tr>
                                      );
                                    })}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 text-base font-bold"><DollarSign size={18} className="text-blue-500" /><span>特定空間設備 (廚衛、冷氣等)</span></div>
                    <button onClick={() => setShowDatabaseModal(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors rounded-lg shadow-sm">
                      <Database size={16} /> 從資料庫加入設備
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto pb-2">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap table-fixed min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 w-[35%]">設備名稱 / 品牌 / 備註</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[10%]">單位</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">單價</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">數量</th>
                            <th className="px-4 py-3 font-bold text-slate-500 w-[15%] text-right">小計</th>
                            <th className="px-4 py-3 w-[10%] text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSpace.items.filter(i => i.category === 'kitchen_equipment' || i.category === 'bath_equipment' || i.category === 'equipment').map((item) => {
                            const isEditing = editingItemId === item.id;
                            return (
                              <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-4 py-2.5">
                                  <div className="flex flex-col gap-1 w-full">
                                    {isEditing ? <input type="text" value={item.name ?? ''} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 text-xs" placeholder="設備名稱" /> : <div className="font-bold text-slate-800 text-sm truncate">{item.name}</div>}
                                    <div className="flex items-center gap-1.5 mt-0.5 w-full">
                                      {isEditing ? (
                                        <>
                                          <input type="text" value={item.brand || ''} onChange={(e) => updateItem(item.id, 'brand', e.target.value)} className="w-20 shrink-0 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="品牌 / 規格" />
                                          <input type="text" value={item.remarks || ''} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} className="flex-1 w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] italic outline-none focus:ring-1 focus:ring-blue-500" placeholder="備註說明..." />
                                        </>
                                      ) : (
                                        <>
                                          {item.brand && <span className="text-[10px] shrink-0 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]">{item.brand}</span>}
                                          {item.remarks && <span className="text-[10px] text-slate-400 italic truncate w-full flex-1">{item.remarks}</span>}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">{isEditing ? <input type="text" value={item.unit ?? ''} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="text-slate-600 font-medium">{item.unit}</span>}</td>
                                <td className="px-3 py-2.5 text-right">{isEditing ? <input type="number" value={item.price ?? 0} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono text-slate-600">{(item.price).toLocaleString()}</span>}</td>
                                <td className="px-3 py-2.5 text-right">{isEditing ? <input type="number" step="0.1" value={item.quantity ?? 0} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{item.quantity}</span>}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-blue-600 font-mono text-[13px]">{(item.price * item.quantity).toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-center">
                                  <div className={`flex items-center justify-center gap-1 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {isEditing ? (
                                      <>
                                        <button onClick={() => setEditingItemId(null)} className="text-white bg-green-500 hover:bg-green-600 p-1 rounded transition-colors shadow-sm" title="儲存"><Check size={12} /></button>
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="刪除"><Trash2 size={12} /></button>
                                      </>
                                    ) : (
                                      <button onClick={() => setEditingItemId(item.id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="編輯"><Edit2 size={14} /></button>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                          {activeSpace.items.filter(i => i.category === 'kitchen_equipment' || i.category === 'bath_equipment' || i.category === 'equipment').length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400"><Package size={32} className="mx-auto mb-2 opacity-50" /><p>尚無任何設備，請從上方「從資料庫加入設備」提取</p></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 text-base font-bold"><User size={18} className="text-blue-500" /><span>其他費用明細 (工資、廢棄物清運等)</span></div>
                    <button onClick={() => setShowDatabaseModal(true)} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors rounded-lg shadow-sm">
                      <Database size={16} /> 從資料庫加入項目
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto pb-2">
                      <table className="w-full text-left border-collapse text-xs whitespace-nowrap table-fixed min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 w-[35%]">項目 / 說明</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[10%]">單位</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">單價</th>
                            <th className="px-3 py-3 font-bold text-slate-500 w-[15%] text-right">數量</th>
                            <th className="px-4 py-3 font-bold text-slate-500 w-[15%] text-right">小計</th>
                            <th className="px-4 py-3 w-[10%] text-center">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.keys(categories).filter(c => ['labor', 'waste'].includes(c)).map(cat => {
                            const catItems = activeSpace.items.filter(i => i.category === cat);
                            if (catItems.length === 0) return null;
                            return (
                              <React.Fragment key={cat}>
                                <tr className="bg-slate-50/50"><td colSpan={6} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100">▍{categories[cat]}</td></tr>
                                <AnimatePresence initial={false}>
                                    {catItems.map((item) => {
                                      const isEditing = editingItemId === item.id;
                                      return (
                                        <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="hover:bg-slate-50 transition-colors group">
                                          <td className="px-4 py-2.5">
                                            <div className="flex flex-col gap-1 w-full">
                                              {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                  <input type="text" value={item.name ?? ''} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 text-xs" placeholder="項目名稱" />
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="font-bold text-slate-800 text-sm truncate">{item.name}</span>
                                                </div>
                                              )}
                                              <div className="flex items-center gap-1.5 mt-0.5 w-full">
                                                {isEditing ? (
                                                  <input type="text" value={item.remarks || ''} onChange={(e) => updateItem(item.id, 'remarks', e.target.value)} className="flex-1 w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] italic outline-none focus:ring-1 focus:ring-blue-500" placeholder="備註說明..." />
                                                ) : (
                                                  item.remarks && <span className="text-[10px] text-slate-400 italic truncate w-full flex-1">{item.remarks}</span>
                                                )}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            {isEditing ? <input type="text" value={item.unit ?? ''} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-12 bg-white border border-slate-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="text-slate-600 font-medium">{item.unit}</span>}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            {isEditing ? <input type="number" value={item.price ?? 0} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono text-slate-600">{(item.price).toLocaleString()}</span>}
                                          </td>
                                          <td className="px-3 py-2.5 text-right">
                                            {isEditing ? <input type="number" step="0.1" value={item.quantity ?? 0} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-right font-mono outline-none focus:ring-1 focus:ring-blue-500 text-xs" /> : <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{item.quantity}</span>}
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-bold text-blue-600 font-mono text-[13px]">
                                            {(item.price * item.quantity).toLocaleString()}
                                          </td>
                                          <td className="px-4 py-2.5 text-center">
                                            <div className={`flex items-center justify-center gap-1 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                              {isEditing ? (
                                                <>
                                                  <button onClick={() => setEditingItemId(null)} className="text-white bg-green-500 hover:bg-green-600 p-1 rounded transition-colors shadow-sm" title="儲存"><Check size={12} /></button>
                                                  <button onClick={() => removeItem(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="刪除"><Trash2 size={12} /></button>
                                                </>
                                              ) : (
                                                <button onClick={() => setEditingItemId(item.id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="編輯"><Edit2 size={14} /></button>
                                              )}
                                            </div>
                                          </td>
                                        </motion.tr>
                                      );
                                    })}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                          {activeSpace.items.filter(i => ['labor', 'waste'].includes(i.category)).length === 0 && (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-400"><p>尚無任何工程費用項目，請從上方「從資料庫加入項目」提取</p></td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 lg:p-10 text-white shadow-2xl shadow-slate-900/20 overflow-hidden relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none scale-150 transform -translate-x-1/4">
                     <Calculator size={300} strokeWidth={0.5} />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div>
                      <p className="text-blue-300 font-semibold mb-2 tracking-wider text-sm flex items-center gap-2"><Square size={14} /> 當前空間小計</p>
                      <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{activeSpace.name}</p>
                      <div className="flex items-baseline gap-2 mt-4"><span className="text-xl font-bold text-slate-400">NT$</span><span className="text-4xl font-black text-white font-mono">{activeSpaceTotal.toLocaleString()}</span></div>
                    </div>
                    <div className="md:text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-700 pt-6 md:pt-0 md:pl-10">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">當前專案總預算</p>
                      <div className="flex items-baseline gap-2 md:justify-end"><span className="text-lg font-bold text-blue-400">NT$</span><span className="text-5xl lg:text-6xl font-black text-white font-mono tracking-tight">{globalTotal.toLocaleString()}</span></div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {viewMode === 'calculation' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">材料轉換係數設定</h2>
                  <p className="text-sm text-slate-500 mt-1">設定自動計算材料數量的基準參數，以及各材質的獨立損耗率</p>
                </div>
                <button 
                  onClick={() => {
                    const newId = Math.random().toString(36).substr(2, 9);
                    setCoefficientSets([...coefficientSets, {
                      id: newId, name: '新係數設定', floorThickness: 4, wallThickness: 2,
                      cementPerM2: Number((0.45 * (globalCementWeight / 50)).toFixed(4)),
                      sandPerM2: 0.055, paintPerM2: 0.08, 
                      cementLossRate: 10, sandLossRate: 10, tileLossRate: 10,
                    }]);
                    setEditingCoefficientId(newId);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={16} /> 新增係數組
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto pb-2">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap table-fixed min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 font-bold text-slate-600 w-[15%] min-w-[100px]">設定名稱</th>
                        <th className="px-2 py-3 font-bold text-slate-600 w-[12%] min-w-[80px] text-center border-l border-slate-200 bg-slate-100/50">厚度 <span className="text-[10px] font-normal text-slate-400 block mt-0.5">(cm)</span></th>
                        <th className="px-2 py-3 font-bold text-slate-600 w-[18%] min-w-[120px] border-l border-slate-200">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>水泥</span>
                            <select value={globalCementWeight} onChange={(e) => handleCementWeightChange(Number(e.target.value))} className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 shadow-sm">
                              <option value={50}>50 kg/包</option>
                              <option value={40}>40 kg/包</option>
                            </select>
                          </div>
                          <span className="text-[10px] font-normal text-slate-400 block">(5cm基 / 損耗)</span>
                        </th>
                        <th className="px-2 py-3 font-bold text-slate-600 w-[18%] min-w-[120px]">砂 <span className="text-[10px] font-normal text-slate-400 block mt-0.5">(5cm基 / 米袋 / 損耗)</span></th>
                        <th className="px-2 py-3 font-bold text-slate-600 w-[10%] min-w-[75px]">磁磚 <span className="text-[10px] font-normal text-slate-400 block mt-0.5">(損耗)</span></th>
                        <th className="px-2 py-3 font-bold text-slate-600 w-[17%] min-w-[120px]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span>油漆</span>
                            <select value={globalPaintCoats} onChange={(e) => handlePaintCoatsChange(Number(e.target.value))} className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 shadow-sm">
                              <option value={1}>1度漆</option>
                              <option value={2}>2度漆</option>
                              <option value={3}>3度漆</option>
                            </select>
                          </div>
                          <span className="text-[10px] font-normal text-slate-400 block">(m²/無損耗)</span>
                        </th>
                        <th className="px-3 py-3 font-bold text-slate-600 text-center w-[10%] min-w-[80px]">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coefficientSets.map(set => {
                        const isEditing = editingCoefficientId === set.id;
                        const cBase = set.cementPerM2 ?? 0.45;
                        const sBase = set.sandPerM2 ?? 0.055;
                        const fThick = set.floorThickness ?? 5;
                        const wThick = set.wallThickness ?? 5;
                        const fCement = cBase * (fThick / 5);
                        const wCement = cBase * (wThick / 5);
                        const fSand = sBase * (fThick / 5);
                        const wSand = sBase * (wThick / 5);
                        const fSandPing = fSand / PING_CONVERSION;
                        const wSandPing = wSand / PING_CONVERSION;

                        return (
                        <tr key={set.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 align-top">
                            {isEditing ? (
                              <input type="text" value={set.name ?? ''} onChange={(e) => setCoefficientSets(coefficientSets.map(s => s.id === set.id ? { ...s, name: e.target.value } : s))} className="w-full bg-white border border-slate-300 px-2 py-1.5 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-xs" />
                            ) : (
                              <span className="font-bold text-slate-800 text-sm truncate block w-full mt-1">{set.name}</span>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top border-l border-slate-100 bg-slate-50/50">
                            {isEditing ? (
                              <div className="flex flex-col gap-2 justify-center items-center">
                                <div className="flex items-center justify-between gap-1.5"><span className="text-[10px] text-slate-600 font-bold bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">地坪</span><input type="number" step="0.1" min="0.1" value={fThick} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, floorThickness: Number(e.target.value)} : s))} className="w-12 text-center text-xs font-mono font-bold text-blue-700 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-0.5" /></div>
                                <div className="flex items-center justify-between gap-1.5"><span className="text-[10px] text-slate-600 font-bold bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">牆面</span><input type="number" step="0.1" min="0.1" value={wThick} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, wallThickness: Number(e.target.value)} : s))} className="w-12 text-center text-xs font-mono font-bold text-blue-700 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none py-0.5" /></div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5 items-center mt-0.5">
                                <span className="text-blue-700 font-mono text-[11px] font-bold bg-white border border-slate-200 shadow-sm rounded px-1.5 py-0.5 w-full text-center">地 {fThick} <span className="font-sans text-[9px] font-normal">cm</span></span>
                                <span className="text-indigo-700 font-mono text-[11px] font-bold bg-white border border-slate-200 shadow-sm rounded px-1.5 py-0.5 w-full text-center">牆 {wThick} <span className="font-sans text-[9px] font-normal">cm</span></span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top border-l border-slate-100">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 focus-within:ring-1 focus-within:ring-blue-500">
                                  <input type="number" step="0.01" value={set.cementPerM2 ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, cementPerM2: Number(e.target.value)} : s))} className="w-10 outline-none text-right font-mono text-xs text-slate-800 bg-transparent flex-1" />
                                  <span className="text-[10px] text-slate-500 shrink-0">包/m²</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 mt-0.5 focus-within:ring-1 focus-within:ring-blue-500">
                                  <span className="text-[10px] text-slate-400 pl-1 shrink-0">損耗:</span>
                                  <input type="number" step="1" value={set.cementLossRate ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, cementLossRate: Number(e.target.value)} : s))} className="w-8 outline-none text-right font-mono text-xs text-red-500 font-bold bg-transparent flex-1" />
                                  <span className="text-[10px] text-slate-500 shrink-0">%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex items-baseline justify-between mb-1"><span className="text-slate-800 font-mono text-[13px] font-bold">{cBase} <span className="text-[10px] text-slate-400 font-sans font-normal">包/m²</span></span></div>
                                <div className="flex flex-col gap-1">
                                  <div className="text-blue-700 font-mono text-[10px] bg-blue-50/50 px-2 py-1 rounded border border-blue-100 flex items-center justify-between min-h-[22px] w-full font-bold">
                                    <span className="font-sans font-medium text-slate-500">地:</span> 約 {(fCement / PING_CONVERSION).toFixed(2)} 包/坪
                                  </div>
                                  <div className="text-indigo-700 font-mono text-[10px] bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 flex items-center justify-between min-h-[22px] w-full font-bold">
                                    <span className="font-sans font-medium text-slate-500">牆:</span> 約 {(wCement / PING_CONVERSION).toFixed(2)} 包/坪
                                  </div>
                                </div>
                                <span className="text-red-500 font-mono text-[10px] font-bold mt-1 text-right block pr-1">+{set.cementLossRate}% 損耗</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top border-l border-slate-100">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 focus-within:ring-1 focus-within:ring-blue-500">
                                  <input type="number" step="0.001" value={set.sandPerM2 ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, sandPerM2: Number(e.target.value)} : s))} className="w-12 outline-none text-right font-mono text-xs text-slate-800 bg-transparent flex-1" />
                                  <span className="text-[10px] text-slate-500 shrink-0">m³/m²</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 mt-0.5 focus-within:ring-1 focus-within:ring-blue-500">
                                  <span className="text-[10px] text-slate-400 pl-1 shrink-0">損耗:</span>
                                  <input type="number" step="1" value={set.sandLossRate ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, sandLossRate: Number(e.target.value)} : s))} className="w-8 outline-none text-right font-mono text-xs text-red-500 font-bold bg-transparent flex-1" />
                                  <span className="text-[10px] text-slate-500 shrink-0">%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-slate-800 font-mono text-[13px] font-bold">{sBase} <span className="text-[10px] text-slate-400 font-sans font-normal">m³/m²</span></span>
                                <div className="flex flex-col gap-1">
                                  <div className="text-blue-700 font-mono text-[10px] bg-blue-50/50 px-2 py-1 rounded border border-blue-100 flex flex-col gap-0.5 w-full min-h-[36px] justify-center font-bold">
                                    <div className="flex items-center justify-between px-0.5"><span className="font-sans font-medium text-slate-500">地:</span> <span>{fSandPing.toFixed(2)} m³/坪</span></div>
                                    <span className="text-[9px] text-blue-500/70 text-right border-t border-blue-100/50 pt-0.5">約 {(fSandPing/0.02).toFixed(1)} 袋</span>
                                  </div>
                                  <div className="text-indigo-700 font-mono text-[10px] bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 flex flex-col gap-0.5 w-full min-h-[36px] justify-center font-bold">
                                    <div className="flex items-center justify-between px-0.5"><span className="font-sans font-medium text-slate-500">牆:</span> <span>{wSandPing.toFixed(2)} m³/坪</span></div>
                                    <span className="text-[9px] text-indigo-500/70 text-right border-t border-indigo-100/50 pt-0.5">約 {(wSandPing/0.02).toFixed(1)} 袋</span>
                                  </div>
                                </div>
                                <span className="text-red-500 font-mono text-[10px] font-bold mt-1 text-right block pr-1">+{set.sandLossRate}% 損耗</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top border-l border-slate-100">
                            {isEditing ? (
                              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 focus-within:ring-1 focus-within:ring-blue-500 mt-1">
                                <span className="text-[10px] text-slate-400 pl-1 shrink-0">損耗:</span>
                                <input type="number" step="1" value={set.tileLossRate ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, tileLossRate: Number(e.target.value)} : s))} className="w-8 outline-none text-right font-mono text-xs text-red-500 font-bold bg-transparent flex-1" />
                                <span className="text-[10px] text-slate-500 shrink-0">%</span>
                              </div>
                            ) : (
                              <div className="flex flex-col mt-0.5 h-full">
                                <span className="text-red-500 font-mono text-[10px] font-bold text-right block pr-1 mt-auto pb-1">+{set.tileLossRate}% 損耗</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top border-l border-slate-100">
                            {isEditing ? (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-1 py-1 focus-within:ring-1 focus-within:ring-blue-500">
                                  <input type="number" step="0.01" value={set.paintPerM2 ?? 0} onChange={(e) => setCoefficientSets(coeff => coeff.map(s => s.id === set.id ? {...s, paintPerM2: Number(e.target.value)} : s))} className="w-10 outline-none text-right font-mono text-xs text-slate-800 bg-transparent flex-1" />
                                  <span className="text-[10px] text-slate-500 shrink-0">加侖/m²</span>
                                </div>
                                <div className="px-1 py-1 text-[10px] text-slate-400 italic">油漆無計算損耗</div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex items-baseline justify-between mb-1">
                                  <span className="text-slate-800 font-mono text-[13px] font-bold">{set.paintPerM2 || 0.08} <span className="text-[10px] text-slate-400 font-sans font-normal">加侖/m²</span></span>
                                  <span className="text-slate-400 font-sans text-[9px] italic block pr-1"></span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="text-indigo-700 font-mono text-[10px] bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 flex flex-col gap-0.5 w-full min-h-[36px] justify-center font-bold">
                                    <div className="flex items-center justify-between px-0.5"><span className="font-sans font-medium text-slate-500">牆:</span> <span>約 {((set.paintPerM2 || 0.08) / PING_CONVERSION).toFixed(2)} 加侖/坪</span></div>
                                    <span className="text-[9px] text-indigo-500/70 text-right border-t border-indigo-100/50 pt-0.5">({globalPaintCoats}度漆總量)</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center align-top pt-4">
                            <div className="flex items-center justify-center gap-1.5 mt-0.5">
                              {isEditing ? (
                                <>
                                  <button onClick={() => setEditingCoefficientId(null)} className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded-lg transition-colors shadow-sm" title="儲存"><Check size={14} /></button>
                                  <button onClick={() => { if(coefficientSets.length > 1) { setCoefficientSets(coefficientSets.filter(s => s.id !== set.id)); } else { setAlertMessage("至少需保留一組係數設定"); } }} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="刪除"><Trash2 size={14} /></button>
                                </>
                              ) : (
                                <button onClick={() => setEditingCoefficientId(set.id)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="編輯"><Edit2 size={14} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'database' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">建材資料庫管理</h2>
                  <p className="text-sm text-slate-500 mt-1">管理各類建材、設備的標準價格與規格</p>
                </div>
                <button onClick={() => setIsAddCategoryModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"><Plus size={16} /> 新增自訂類別</button>
              </div>

              <div className="space-y-6">
                {Object.entries(categories).map(([cat, label]) => {
                  const isExpanded = expandedCategories[cat] ?? false;
                  const items = databaseItems.filter(i => i.category === cat).sort((a, b) => {
                    if (!sortBy) return 0;
                    const valA = a[sortBy];
                    const valB = b[sortBy];
                    if (typeof valA === 'string' && typeof valB === 'string') return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    if (typeof valA === 'number' && typeof valB === 'number') return sortOrder === 'asc' ? valA - valB : valB - valA;
                    return 0;
                  });
                  
                  return (
                    <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => toggleCategory(cat)}>
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                          <h3 className="font-bold text-slate-800 text-lg flex items-center">
                            {label}
                            <span className="text-sm text-slate-400 font-normal ml-3 bg-white px-2 py-0.5 rounded-full border border-slate-200">{items.length} 項</span>
                            {cat.startsWith('custom_') && <button onClick={(e) => { e.stopPropagation(); setCategoryToDelete({ id: cat, label }); }} className="ml-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100" title="刪除自訂類別"><Trash2 size={16} /></button>}
                          </h3>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); addDatabaseItem(cat as any); }} className="text-sm font-bold flex items-center gap-1.5 text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-blue-50 transition-colors"><Plus size={14} /> 新增項目</button>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-200">
                            <div className="overflow-x-auto pb-2">
                              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                <thead>
                                  <tr className="bg-white border-b border-slate-100 text-slate-500">
                                    <th className="px-4 py-2 font-semibold cursor-pointer hover:text-slate-800 min-w-[180px] w-[25%]" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>項目名稱 ⇅</th>
                                    <th className="px-3 py-2 font-semibold w-16 min-w-[64px]">單位</th>
                                    <th className="px-3 py-2 font-semibold w-20 min-w-[80px]">預設數量</th>
                                    <th className="px-3 py-2 font-semibold cursor-pointer hover:text-slate-800 w-24 min-w-[100px]" onClick={() => { setSortBy('price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>單價 ⇅</th>
                                    <th className="px-3 py-2 font-semibold w-24 min-w-[100px]">品牌</th>
                                    <th className="px-3 py-2 font-semibold w-24 min-w-[100px]">規格</th>
                                    <th className="px-3 py-2 font-semibold min-w-[120px]">備註</th>
                                    <th className="px-4 py-2 font-semibold text-center w-16 min-w-[80px]">操作</th>
                                  </tr>
                                </thead>
                                  <Reorder.Group axis="y" values={items} onReorder={(newItems) => reorderDatabaseItems(newItems, cat)} as="tbody" className="divide-y divide-slate-100">
                                    {items.map((item) => {
                                      const isEditing = editingDbId === item.id;
                                      return (
                                        <Reorder.Item key={item.id} value={item} as="tr" className={`transition-colors cursor-default ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                          <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                              <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500 transition-colors" title="拖曳排序"><GripVertical size={14} /></div>
                                              {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                  <input type="text" value={item.name} onChange={(e) => updateDatabaseItem(item.id, 'name', e.target.value)} className="w-full bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-semibold" />
                                                  {item.category === 'tile' && (
                                                    <select value={item.tileType || 'floor'} onChange={(e) => updateDatabaseItem(item.id, 'tileType', e.target.value as 'floor' | 'wall')} className="w-16 shrink-0 bg-white border border-slate-300 rounded px-1 py-1 text-[11px] text-teal-700 font-bold outline-none focus:ring-1 focus:ring-blue-500">
                                                      <option value="floor">地磚</option>
                                                      <option value="wall">壁磚</option>
                                                    </select>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  <span className="font-semibold text-slate-800 truncate block max-w-[120px] sm:max-w-[200px]">{item.name}</span>
                                                  {item.category === 'tile' && item.tileType && <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium border ${item.tileType === 'wall' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>{item.tileType === 'wall' ? '壁磚' : '地磚'}</span>}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2">{isEditing ? <input type="text" value={item.unit} onChange={(e) => updateDatabaseItem(item.id, 'unit', e.target.value)} className="w-10 bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700" /> : <span className="text-slate-600">{item.unit}</span>}</td>
                                          <td className="px-3 py-2">{isEditing ? <input type="number" value={item.quantity} onChange={(e) => updateDatabaseItem(item.id, 'quantity', Number(e.target.value))} className="w-14 bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-700" /> : <span className="text-slate-600 font-mono">{item.quantity}</span>}</td>
                                          <td className="px-3 py-2">{isEditing ? <input type="number" value={item.price} onChange={(e) => updateDatabaseItem(item.id, 'price', Number(e.target.value))} className="w-20 bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono text-slate-700" /> : <span className="text-slate-800 font-mono font-medium text-[13px]">NT$ {item.price.toLocaleString()}</span>}</td>
                                          <td className="px-3 py-2">{isEditing ? <input type="text" value={item.brand || ''} onChange={(e) => updateDatabaseItem(item.id, 'brand', e.target.value)} className="w-full bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700" placeholder="品牌..." /> : <span className="text-slate-500 truncate block max-w-[80px] sm:max-w-[120px]">{item.brand || '-'}</span>}</td>
                                          <td className="px-3 py-2">{isEditing ? <input type="text" value={item.size || ''} onChange={(e) => updateDatabaseItem(item.id, 'size', e.target.value)} className="w-full bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700" placeholder="規格..." /> : <span className="text-slate-500 truncate block max-w-[80px] sm:max-w-[120px]">{item.size || '-'}</span>}</td>
                                          <td className="px-3 py-2">{isEditing ? <input type="text" value={item.remarks || ''} onChange={(e) => updateDatabaseItem(item.id, 'remarks', e.target.value)} className="w-full bg-white border border-slate-300 px-1.5 py-1 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-800" placeholder="備註..." /> : <span className="text-slate-400 italic text-[11px] truncate block max-w-[100px] sm:max-w-[150px]">{item.remarks || '-'}</span>}</td>
                                          <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              <button onClick={() => isEditing ? setEditingDbId(null) : setEditingDbId(item.id)} className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}>{isEditing ? <Check size={14} /> : <Edit2 size={14} />}</button>
                                              <button onClick={() => removeDatabaseItem(item.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                          </td>
                                        </Reorder.Item>
                                      );
                                    })}
                                  </Reorder.Group>
                              </table>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {viewMode === 'summary' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">總結報告</h2>
                    <p className="text-sm text-slate-500 mt-1">全案估算總結與報價細項</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                      <button onClick={() => setSummaryViewMode('category')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${summaryViewMode === 'category' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>大項目總計</button>
                      <button onClick={() => setSummaryViewMode('detail')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${summaryViewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}>各空間細項</button>
                    </div>
                    <button 
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                    >
                      <Printer size={16} /> 匯出報價單
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">客戶名稱</label>
                    <input type="text" value={quoteDetails.client} onChange={e => setQuoteDetails({...quoteDetails, client: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="例如：王小明 先生" />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">專案名稱</label>
                    <input type="text" value={quoteDetails.project} onChange={e => setQuoteDetails({...quoteDetails, project: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="例如：新北信義區室內裝修" />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">公司名稱</label>
                    <input type="text" value={quoteDetails.companyName} onChange={e => setQuoteDetails({...quoteDetails, companyName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="您的工作室名稱" />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">聯絡電話</label>
                    <input type="text" value={quoteDetails.companyPhone} onChange={e => setQuoteDetails({...quoteDetails, companyPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="02-1234-5678" />
                  </div>
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-500 mb-1">電子信箱</label>
                    <input type="text" value={quoteDetails.companyEmail} onChange={e => setQuoteDetails({...quoteDetails, companyEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="service@example.com" />
                  </div>
                  <div className="w-full md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">公司地址</label>
                    <input type="text" value={quoteDetails.companyAddress} onChange={e => setQuoteDetails({...quoteDetails, companyAddress: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="台北市..." />
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">管理費 (%)</label>
                      <input type="number" value={quoteDetails.markup} onChange={e => setQuoteDetails({...quoteDetails, markup: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="10" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">營業稅</label>
                      <select value={quoteDetails.tax} onChange={e => setQuoteDetails({...quoteDetails, tax: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4 shadow-sm">
                      <div className="p-4 bg-white rounded-xl shadow-sm text-indigo-600 border border-indigo-50"><Home size={28}/></div>
                      <div>
                        <p className="text-xs font-bold text-indigo-500 mb-1">空間總數</p>
                        <p className="text-2xl font-black text-slate-800">{spaces.length} <span className="text-sm font-normal text-slate-500">個</span></p>
                      </div>
                    </div>
                    <div className="bg-teal-50/50 p-6 rounded-2xl border border-teal-100 flex items-center gap-4 shadow-sm">
                      <div className="p-4 bg-white rounded-xl shadow-sm text-teal-600 border border-teal-50"><Layers size={28}/></div>
                      <div>
                        <p className="text-xs font-bold text-teal-500 mb-1">總施作坪數</p>
                        <p className="text-2xl font-black text-slate-800 font-mono">
                          {spaces.reduce((sum, s) => {
                            const tOpening = s.openings.reduce((oSum, o) => oSum + (o.width * o.height), 0);
                            const sFloorArea = s.segments.reduce((sum, seg) => sum + seg.area, 0);
                            const sWallArea = Math.max(0, s.segments.reduce((sum, seg) => sum + (2 * (seg.length + seg.width) * seg.height), 0) - tOpening);
                            return sum + (sFloorArea + sWallArea) * PING_CONVERSION;
                          }, 0).toFixed(1)} <span className="text-sm font-sans font-normal text-slate-500">坪</span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-600 p-6 rounded-2xl border border-blue-700 flex items-center gap-4 relative overflow-hidden shadow-lg shadow-blue-200">
                      <div className="absolute -right-4 -bottom-4 text-blue-500 opacity-30 pointer-events-none"><DollarSign size={120} strokeWidth={3} /></div>
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-blue-100 mb-1">預估總預算</p>
                        <p className="text-3xl font-black text-white font-mono">NT$ {globalTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                      全案分類總計
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(categories).map(([cat, label]) => {
                        const total = spaces.reduce((sum, s) => sum + s.items.filter(i => i.category === cat && !i.hiddenInSummary).reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
                        if (total === 0) return null;
                        
                        // 定義分類顏色
                        const colorMap: Record<string, string> = {
                          kitchen_equipment: 'border-orange-200 bg-orange-50/30 text-orange-600',
                          bath_equipment: 'border-blue-200 bg-blue-50/30 text-blue-600',
                          tile: 'border-teal-200 bg-teal-50/30 text-teal-600',
                          material: 'border-amber-200 bg-amber-50/30 text-amber-600',
                          waterproof: 'border-cyan-200 bg-cyan-50/30 text-cyan-600',
                          waste: 'border-rose-200 bg-rose-50/30 text-rose-600',
                          labor: 'border-indigo-200 bg-indigo-50/30 text-indigo-600'
                        };
                        const colorClass = colorMap[cat] || 'border-slate-200 bg-slate-50/30 text-slate-600';

                        return (
                          <div key={cat} className={`p-5 rounded-xl border ${colorClass.split(' ').slice(0, 2).join(' ')} shadow-sm hover:shadow-md transition-all group`}>
                            <p className={`text-xs font-bold mb-2 opacity-70 group-hover:opacity-100 transition-opacity`}>{label}</p>
                            <p className="text-lg font-bold text-slate-900 font-mono">NT$ {total.toLocaleString()}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- Visual Analytics Section --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                        預算分類佔比
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartCategoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartCategoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '金額']}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                        各空間預算對比
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartSpaceData} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={80} 
                              axisLine={false} 
                              tickLine={false}
                              tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                            />
                            <Tooltip 
                              cursor={{ fill: '#f1f5f9' }}
                              formatter={(value: number) => [`NT$ ${value.toLocaleString()}`, '預算']}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                              dataKey="value" 
                              fill="#6366f1" 
                              radius={[0, 8, 8, 0]} 
                              barSize={24}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {summaryViewMode === 'detail' && (
                    <div className="space-y-10 pt-6">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-bold text-slate-800">各空間明細</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Info size={14} /> 點擊文字直接修改，點擊右側圖示隱藏項目
                        </p>
                      </div>
                      <div className="space-y-8">
                        {spaces.map(space => {
                          const visibleItems = space.items.filter(i => !i.hiddenInSummary);
                          const sTotal = visibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
                          return (
                            <div key={space.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {spaces.findIndex(x => x.id === space.id) + 1}
                                  </div>
                                  <span className="text-lg font-bold text-slate-800">{space.name} <span className="text-sm text-slate-500 font-normal">({SPACE_TYPE_LABELS[space.type]})</span></span>
                                </div>
                                <span className="font-mono font-bold text-xl text-blue-600">NT$ {sTotal.toLocaleString()}</span>
                              </div>
                              <div className="p-0 overflow-x-auto">
                                <table className="w-full text-xs text-left whitespace-nowrap">
                                  <thead>
                                    <tr className="text-slate-500 font-semibold bg-white border-b border-slate-200 text-[11px]">
                                      <th className="py-2 px-4 w-[40%] min-w-[250px]">項目明細</th>
                                      <th className="py-2 px-3 text-right w-20 min-w-[80px]">單價</th>
                                      <th className="py-2 px-3 text-right w-16 min-w-[80px]">數量</th>
                                      <th className="py-2 px-3 text-right w-24 min-w-[112px]">小計</th>
                                      <th className="py-2 px-3 text-center w-12 min-w-[64px]">顯示</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {Object.entries(categories).map(([cat, label]) => {
                                      const catItems = space.items.filter(i => i.category === cat);
                                      if (catItems.length === 0) return null;
                                      return (
                                        <React.Fragment key={cat}>
                                          <tr className="bg-slate-50/50"><td colSpan={5} className="py-1.5 px-4 font-bold text-slate-600 text-[10px] tracking-wider">▍{label}</td></tr>
                                          {catItems.map(item => (
                                            <tr key={item.id} className={`text-slate-700 hover:bg-slate-50 transition-colors ${item.hiddenInSummary ? 'opacity-40 grayscale bg-slate-50/50' : ''}`}>
                                              <td className="py-2 px-4">
                                                <div className="flex flex-col gap-1">
                                                  <input type="text" value={item.name ?? ''} onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, name: e.target.value } : i) } : s); setSpaces(newSpaces); }} className="font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-400 p-0 w-full outline-none transition-colors" />
                                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    <input type="text" value={item.brand || ''} placeholder="品牌" onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, brand: e.target.value } : i) } : s); setSpaces(newSpaces); }} className="text-[11px] text-slate-500 bg-transparent border-b border-transparent focus:border-blue-400 p-0 w-20 outline-none transition-colors shrink-0" />
                                                    {item.category === 'tile' && <input type="text" value={item.size || ''} placeholder="尺寸" onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, size: e.target.value } : i) } : s); setSpaces(newSpaces); }} className="text-[11px] text-blue-600 bg-transparent border-b border-transparent focus:border-blue-400 p-0 w-16 outline-none transition-colors font-medium shrink-0" />}
                                                    <input type="text" value={item.remarks || ''} placeholder="備註說明..." onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, remarks: e.target.value } : i) } : s); setSpaces(newSpaces); }} className="text-[11px] text-slate-400 italic bg-transparent border-b border-transparent focus:border-blue-400 p-0 flex-1 min-w-[80px] outline-none transition-colors" />
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono">
                                                <div className="flex items-center justify-end gap-1 group/price">
                                                  <span className="text-slate-400 text-[10px]">NT$</span>
                                                  <input type="number" value={item.price ?? 0} onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, price: Number(e.target.value) } : i) } : s); setSpaces(newSpaces); }} className="w-16 bg-transparent border-b border-transparent group-hover/price:border-slate-300 focus:border-blue-500 p-0 text-right outline-none text-slate-700 transition-colors" />
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono">
                                                <div className="flex items-center justify-end gap-1 group/qty">
                                                  <input type="number" step="0.1" value={item.quantity ?? 0} onChange={(e) => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, quantity: Number(e.target.value) } : i) } : s); setSpaces(newSpaces); }} className="w-12 bg-transparent border-b border-transparent group-hover/qty:border-slate-300 focus:border-blue-500 p-0 text-right outline-none transition-colors text-slate-700" />
                                                  <span className="text-[10px] font-sans text-slate-500 shrink-0">{item.unit}</span>
                                                </div>
                                              </td>
                                              <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono text-[13px]">{(item.price * item.quantity).toLocaleString()}</td>
                                              <td className="py-2 px-3 text-center">
                                                <button onClick={() => { const newSpaces = spaces.map(s => s.id === space.id ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, hiddenInSummary: !i.hiddenInSummary } : i) } : s); setSpaces(newSpaces); }} className={`p-1 rounded-md transition-colors inline-flex ${item.hiddenInSummary ? 'text-slate-300 hover:text-blue-500 hover:bg-blue-50' : 'text-blue-500 bg-blue-50 hover:bg-blue-100'}`} title={item.hiddenInSummary ? "點擊顯示" : "點擊隱藏"}>
                                                  {item.hiddenInSummary ? <Square size={14} /> : <Check size={14} />}
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                          <tr className="border-t border-slate-200 bg-slate-50/30">
                                            <td colSpan={3} className="py-2 px-4 text-right text-[11px] font-bold text-slate-500">{label} 小計</td>
                                            <td className="py-2 px-3 text-right font-bold text-blue-600 font-mono text-[13px]">NT$ {catItems.filter(i => !i.hiddenInSummary).reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()}</td>
                                            <td></td>
                                          </tr>
                                        </React.Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* --- 全域 Modal UI --- */}

      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAlertMessage(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border border-slate-200 z-10">
              <div className="bg-orange-50 text-orange-500 p-4 rounded-full mb-4"><AlertCircle size={32} /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">系統提示</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">{alertMessage}</p>
              <button onClick={() => setAlertMessage(null)} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">我知道了</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {spaceToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSpaceToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-slate-100 z-10">
              <div className="bg-red-50 text-red-500 p-5 rounded-full mb-5"><Trash2 size={36} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">刪除空間「{spaceToDelete.name}」</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                確定要刪除此空間嗎？<br/>該空間內的所有估算明細將會一併移除，<strong className="text-red-500">且無法復原。</strong>
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setSpaceToDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">取消</button>
                <button onClick={executeRemoveSpace} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">確定刪除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDatabaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 lg:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDatabaseModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-slate-50 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200/50">
              <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Database size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">從資料庫加入標準項目</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">選擇要加入至 <span className="font-bold text-blue-600 px-1">{activeSpace.name}</span> 的建材與設備</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={dbSearchTerm} 
                      onChange={(e) => setDbSearchTerm(e.target.value)} 
                      placeholder="搜尋建材名稱..." 
                      className="w-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow pl-10"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Database size={16} />
                    </div>
                    {dbSearchTerm && (
                      <button onClick={() => setDbSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button onClick={() => setShowDatabaseModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"><X size={24} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {Object.entries(categories).map(([cat, label]) => {
                    const isExpanded = expandedCategories[cat] ?? false;
                    const items = databaseItems.filter(i => 
                      i.category === cat && 
                      (dbSearchTerm === '' || i.name.toLowerCase().includes(dbSearchTerm.toLowerCase()))
                    );
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm self-start">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer group" onClick={() => toggleCategory(cat)}>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><div className="w-1.5 h-6 rounded-full bg-blue-500" />{label}<span className="text-xs text-slate-500 font-normal ml-2 bg-slate-100 px-2 py-0.5 rounded-full">{items.length} 筆</span></h3>
                          <div className="text-slate-400 group-hover:text-blue-500 transition-colors bg-slate-50 p-1.5 rounded-md">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="grid grid-cols-1 gap-2 pt-2">
                                {items.map((item) => (
                                  <button key={item.id} onClick={() => addFromDatabase(item)} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group">
                                    <div>
                                      <p className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors mb-1">{item.name}</p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">單位: {item.unit}</span>
                                        {item.brand && <span className="text-[11px] text-slate-500 px-1 border-l border-slate-300">{item.brand}</span>}
                                        {item.size && <span className="text-[11px] text-slate-500 px-1 border-l border-slate-300">{item.size}</span>}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-slate-800 text-base">NT$ {item.price.toLocaleString()}</p>
                                      <p className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1 justify-end"><Plus size={12} /> 加入清單</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center z-10">
                <p className="text-xs text-slate-500 hidden sm:block">點擊任一項目即可將其加入當前空間估算中</p>
                <button onClick={() => setShowDatabaseModal(false)} className="px-8 py-2.5 rounded-lg font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors w-full sm:w-auto">完成並關閉</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col border border-slate-200 z-10">
              <h3 className="text-lg font-bold text-slate-800 mb-4">新增自訂類別</h3>
              <input autoFocus type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newCategoryName.trim()) { const newCatId = `custom_${Math.random().toString(36).substr(2, 9)}`; setCategories(prev => ({ ...prev, [newCatId]: newCategoryName.trim() })); setExpandedCategories(prev => ({ ...prev, [newCatId]: true })); setIsAddCategoryModalOpen(false); } }} className="w-full border border-slate-300 px-3 py-2 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" placeholder="例如：木作工程、系統櫃" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAddCategoryModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">取消</button>
                <button onClick={() => { if (newCategoryName.trim()) { const newCatId = `custom_${Math.random().toString(36).substr(2, 9)}`; setCategories(prev => ({ ...prev, [newCatId]: newCategoryName.trim() })); setExpandedCategories(prev => ({ ...prev, [newCatId]: true })); setIsAddCategoryModalOpen(false); } }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">新增</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCategoryToDelete(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center border border-slate-200 z-10">
              <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4"><Trash2 size={32} /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">刪除「{categoryToDelete.label}」類別</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">確定要刪除此類別嗎？<br/>這會同時移除資料庫中該類別的<strong className="text-red-500">所有預設項目</strong>，且無法復原。</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setCategoryToDelete(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">取消</button>
                <button onClick={() => { setCategories(prev => { const newCats = { ...prev }; delete newCats[categoryToDelete.id]; return newCats; }); setDatabaseItems(prev => prev.filter(i => i.category !== categoryToDelete.id)); setCategoryToDelete(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors">確定刪除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Floating Unit Converter --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 print:hidden">
        <AnimatePresence>
          {showUnitConverter && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-0 w-72 mb-2 overflow-hidden"
            >
              <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                <h4 className="font-bold flex items-center gap-2 text-sm"><Calculator size={16} className="text-blue-400" /> 裝修單位換算器</h4>
                <button onClick={() => setShowUnitConverter(false)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
              </div>
              
              <div className="p-4 space-y-5">
                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['area', 'length', 'volume'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => {
                        const activeTab = tab as 'area' | 'length' | 'volume';
                        setActiveConverterTab(activeTab);
                        
                        // Reset inputs when switching tabs
                        const container = document.getElementById('converter-content');
                        if (container) {
                          const inputs = container.querySelectorAll('input');
                          inputs.forEach(i => i.value = '');
                        }
                      }}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeConverterTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {tab === 'area' ? '面積' : tab === 'length' ? '長度' : '體積'}
                    </button>
                  ))}
                </div>

                <div id="converter-content" className="space-y-4">
                  {activeConverterTab === 'area' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">坪數</label>
                          <input type="number" step="0.01" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value);
                            const m2 = document.getElementById('conv-m2') as HTMLInputElement;
                            const cai = document.getElementById('conv-cai') as HTMLInputElement;
                            if (m2) m2.value = (v / PING_CONVERSION).toFixed(2);
                            if (cai) cai.value = (v * 36).toFixed(1);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">平方公尺 (m²)</label>
                          <input id="conv-m2" type="number" step="0.01" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value);
                            const ping = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                            const cai = document.getElementById('conv-cai') as HTMLInputElement;
                            if (ping) ping.value = (v * PING_CONVERSION).toFixed(2);
                            if (cai) cai.value = (v * PING_CONVERSION * 36).toFixed(1);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">才 (台灣常用)</label>
                        <input id="conv-cai" type="number" step="0.1" placeholder="0" onChange={(e) => {
                          const v = Number(e.target.value);
                          const ping = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                          const m2 = document.getElementById('conv-m2') as HTMLInputElement;
                          if (ping) ping.value = (v / 36).toFixed(2);
                          if (m2) m2.value = (v / 36 / PING_CONVERSION).toFixed(2);
                        }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        <p className="text-[9px] text-slate-400 mt-1 italic">註：1 坪 = 36 才 (6台尺 x 6台尺)</p>
                      </div>
                    </>
                  )}

                  {activeConverterTab === 'length' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">公分 (cm)</label>
                          <input type="number" step="0.1" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value);
                            const m = document.getElementById('conv-m') as HTMLInputElement;
                            const tc = document.getElementById('conv-tc') as HTMLInputElement;
                            const inch = document.getElementById('conv-inch') as HTMLInputElement;
                            if (m) m.value = (v / 100).toFixed(3);
                            if (tc) tc.value = (v / 30.303).toFixed(2);
                            if (inch) inch.value = (v / 2.54).toFixed(2);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">公尺 (m)</label>
                          <input id="conv-m" type="number" step="0.001" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value) * 100;
                            const cm = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                            const tc = document.getElementById('conv-tc') as HTMLInputElement;
                            const inch = document.getElementById('conv-inch') as HTMLInputElement;
                            if (cm) cm.value = v.toString();
                            if (tc) tc.value = (v / 30.303).toFixed(2);
                            if (inch) inch.value = (v / 2.54).toFixed(2);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">台尺 (木作常用)</label>
                          <input id="conv-tc" type="number" step="0.01" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value) * 30.303;
                            const cm = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                            const m = document.getElementById('conv-m') as HTMLInputElement;
                            const inch = document.getElementById('conv-inch') as HTMLInputElement;
                            if (cm) cm.value = v.toFixed(1);
                            if (m) m.value = (v / 100).toFixed(3);
                            if (inch) inch.value = (v / 2.54).toFixed(2);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">英吋 (in)</label>
                          <input id="conv-inch" type="number" step="0.01" placeholder="0" onChange={(e) => {
                            const v = Number(e.target.value) * 2.54;
                            const cm = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                            const m = document.getElementById('conv-m') as HTMLInputElement;
                            const tc = document.getElementById('conv-tc') as HTMLInputElement;
                            if (cm) cm.value = v.toFixed(1);
                            if (m) m.value = (v / 100).toFixed(3);
                            if (tc) tc.value = (v / 30.303).toFixed(2);
                          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </>
                  )}

                  {activeConverterTab === 'volume' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">立方公尺 (m³)</label>
                        <input type="number" step="0.01" placeholder="0" onChange={(e) => {
                          const v = Number(e.target.value);
                          const l = document.getElementById('conv-l') as HTMLInputElement;
                          if (l) l.value = (v * 1000).toString();
                        }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">公升 (L)</label>
                        <input id="conv-l" type="number" step="1" placeholder="0" onChange={(e) => {
                          const v = Number(e.target.value);
                          const m3 = document.querySelector('#converter-content input[placeholder="0"]') as HTMLInputElement;
                          if (m3) m3.value = (v / 1000).toFixed(3);
                        }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <p className="text-[9px] text-slate-400 italic">常用：1 m³ 混凝土約需 1000 公升</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setShowUnitConverter(!showUnitConverter)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${showUnitConverter ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-600/30'}`}
          title="裝修單位換算器"
        >
          {showUnitConverter ? <X size={24} /> : <Calculator size={24} />}
        </button>
      </div>
    </div>
  );
}