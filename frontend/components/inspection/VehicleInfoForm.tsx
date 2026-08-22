'use client';
import { useState, useMemo } from 'react';
import { VehicleInfo, FuelType, Transmission } from '@/lib/types';
import { ArrowRight, Info, ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE INDIAN CAR DATABASE
// Make → Model → Variants[]
// ─────────────────────────────────────────────────────────────────────────────
type CarDB = Record<string, Record<string, string[]>>;

const CAR_DB: CarDB = {
  'Maruti Suzuki': {
    'Alto K10': ['Std', 'LXI', 'VXI', 'VXI+', 'VXI AMT', 'VXI+ AMT'],
    'Swift': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI AMT', 'ZXI AMT', 'ZXI+ AMT'],
    'Swift Dzire': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI AMT', 'ZXI AMT', 'ZXI+ AMT'],
    'Baleno': ['Sigma', 'Delta', 'Zeta', 'Alpha', 'Delta MT', 'Zeta MT', 'Alpha MT', 'Delta AMT', 'Zeta AMT', 'Alpha AMT'],
    'Wagon R': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI AMT', 'ZXI AMT', 'ZXI+ AMT', '1.0L LXI', '1.0L VXI', '1.2L VXI'],
    'Celerio': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI AMT', 'ZXI AMT', 'ZXI+ AMT'],
    'Ignis': ['Sigma', 'Delta', 'Zeta', 'Alpha', 'Zeta AMT', 'Alpha AMT'],
    'S-Presso': ['Std', 'LXI', 'VXI', 'VXI+', 'VXI AMT', 'VXI+ AMT'],
    'Fronx': ['Sigma', 'Delta', 'Zeta', 'Alpha', 'Delta Turbo', 'Zeta Turbo', 'Alpha Turbo'],
    'Brezza': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI AT', 'ZXI AT', 'ZXI+ AT'],
    'Ertiga': ['LXI', 'VXI', 'ZXI', 'ZXI+', 'VXI CNG', 'ZXI AT'],
    'XL6': ['Zeta', 'Alpha', 'Zeta AT', 'Alpha AT'],
    'Grand Vitara': ['Sigma', 'Delta', 'Zeta', 'Alpha', 'Zeta AT', 'Alpha AT', 'Hybrid Zeta', 'Hybrid Alpha'],
    'Jimny': ['Zeta', 'Alpha'],
    'Invicto': ['Zeta AT', 'Alpha AT'],
    'Ciaz': ['Sigma', 'Delta', 'Zeta', 'Alpha', 'Delta AT', 'Alpha AT'],
    'Vitara Brezza': ['LDI', 'LDI+', 'VDI', 'VDI+', 'ZDI', 'ZDI+', 'ZDI+ Dual Tone'],
    'Omni': ['Std', 'E'],
    'Eeco': ['Std', 'AC', 'AC CNG'],
  },
  'Hyundai': {
    'Grand i10 NIOS': ['Era', 'Magna', 'Sportz', 'Asta', 'Sportz AMT', 'Asta AMT', 'Asta (O) AMT'],
    'i20': ['Magna', 'Sportz', 'Asta', 'Asta(O)', 'Sportz iMT', 'Asta iMT', 'Sportz Turbo iMT', 'Asta(O) Turbo DCT'],
    'Venue': ['E', 'S', 'S+', 'SX', 'SX+', 'SX(O)', 'N Line N6', 'N Line N8', 'SX Turbo', 'SX+ Turbo', 'SX(O) Turbo DCT'],
    'Creta': ['E', 'EX', 'S', 'S+', 'SX', 'SX Tech', 'SX(O)', 'SX(O) AT', 'SX(O) DCT', 'Knight Edition'],
    'Alcazar': ['Prestige', 'Prestige(O)', 'Platinum', 'Signature', 'Prestige AT', 'Platinum AT', 'Signature AT'],
    'Tucson': ['GLS AT 2WD', 'GLS AT 4WD', 'Signature AT 2WD', 'Signature AT 4WD'],
    'Ioniq 5': ['RWD Standard Range', 'RWD Long Range', 'AWD Long Range'],
    'i10': ['Era', 'Magna', 'Sportz', 'Asta'],
    'Santro': ['Magna', 'Sportz', 'Sportz AMT', 'Asta', 'Asta AMT'],
    'Aura': ['E', 'S', 'SX', 'SX+', 'S AMT', 'SX AMT', 'SX+ AMT'],
    'Exter': ['EX', 'S', 'S AMT', 'SX', 'SX AMT', 'SX(O)', 'SX(O) AMT'],
    'Verna': ['EX', 'S', 'S MT', 'S AT', 'SX MT', 'SX AT', 'SX Tech MT', 'SX Tech AT', 'SX(O) MT', 'SX(O) AT'],
    'Kona Electric': ['Base', 'Premium'],
    'Elite i20': ['Era', 'Magna', 'Sportz', 'Asta'],
    'i20 Active': ['S', 'SX', 'SX AT'],
  },
  'Tata': {
    'Tiago': ['XE', 'XM', 'XT', 'XZ', 'XZ+', 'XZA', 'XZA+', 'NRG XE', 'NRG XT'],
    'Tigor': ['XE', 'XM', 'XT', 'XZ', 'XZ+', 'XZA', 'XZA+'],
    'Altroz': ['XE', 'XM', 'XT', 'XZ', 'XZ+', 'XZA', 'XZA+', 'iTurbo XT', 'iTurbo XZ', 'iTurbo XZ+', 'DCA XT', 'DCA XZ'],
    'Punch': ['Pure', 'Adventure', 'Accomplished', 'Creative', 'Pure AMT', 'Adventure AMT', 'Accomplished AMT', 'Creative AMT'],
    'Nexon': ['XE', 'XM', 'XM+', 'XT', 'XZ', 'XZ+', 'XZA', 'XZA+', 'Dark XZ+', 'Dark XZA+'],
    'Nexon EV': ['XM', 'XZ+', 'XZ+ LUX', 'Long Range XZ+', 'Long Range XZ+ LUX', 'Empowered+'],
    'Harrier': ['XE', 'XM', 'XT', 'XT+', 'XZ', 'XZ+', 'XZA', 'XZA+', 'Dark XZ+', 'Dark XZA+'],
    'Safari': ['XE', 'XM', 'XT', 'XT+', 'XZ', 'XZ+', 'XZA', 'XZA+', 'Adventure Plus', 'Gold'],
    'Tiago EV': ['XE', 'XM+', 'XT', 'XZ+', 'XZ+ Tech LUX'],
    'Tigor EV': ['XM', 'XZ+', 'XZ+ LUX'],
    'Curvv': ['Creative', 'Accomplished', 'Accomplished+', 'Empowered', 'Empowered+'],
    'Curvv EV': ['Creative+', 'Accomplished+', 'Empowered', 'Empowered+'],
    'Indica': ['LE', 'LSI', 'LXI', 'GLX', 'GLXI', 'GLE', 'GLS'],
    'Indigo': ['LE', 'LSI', 'LXI', 'GLX', 'CS LE', 'CS LXI'],
    'Nano': ['Std', 'CX', 'LX', 'XM', 'XT', 'XTA'],
    'Zest': ['XE', 'XM', 'XT', 'XZ', 'XZA'],
    'Bolt': ['XE', 'XM', 'XT', 'XZ', 'XZA'],
    'Hexa': ['XM', 'XMA', 'XT', 'XTA', 'XZ', 'XZA'],
  },
  'Mahindra': {
    'Thar': ['AX Std', 'AX Opt', 'LX Petrol MT 4WD', 'LX Diesel MT 4WD', 'LX AT 4WD', 'LX Diesel AT 4WD'],
    'XUV700': ['MX', 'AX3', 'AX5', 'AX7', 'AX3 AT', 'AX5 AT', 'AX7 AT', 'AX5 L', 'AX7 L'],
    'Scorpio N': ['Z2', 'Z4', 'Z6', 'Z8', 'Z2 AT', 'Z4 AT', 'Z6 AT', 'Z8 AT', 'Z8 L'],
    'Scorpio Classic': ['S', 'S11'],
    'XUV300': ['W4', 'W6', 'W8', 'W8 (O)', 'W4 AMT', 'W6 AMT', 'W8 AMT', 'W8(O) AMT'],
    'XUV400': ['EC Pro', 'EL Pro', 'EL'],
    'Bolero': ['B2', 'B4', 'B6', 'B6 (O)', 'Power+ B4', 'Power+ B6'],
    'Bolero Neo': ['N4', 'N8', 'N10'],
    'Marazzo': ['M2', 'M4', 'M6', 'M8', 'M4 Plus', 'M6 Plus'],
    'KUV100': ['K2', 'K2+', 'K4', 'K4+', 'K6', 'K6+', 'K8', 'NXT K2', 'NXT K4'],
    'TUV300': ['T4', 'T4+', 'T6', 'T6+', 'T8', 'T8 AMT'],
    'Roxor': ['Std'],
    'BE 6': ['Pack One', 'Pack Two', 'Pack Three'],
    'XEV 9e': ['Pack One', 'Pack Two', 'Pack Three'],
  },
  'Honda': {
    'Amaze': ['E', 'S', 'V', 'VX', 'S MT', 'V MT', 'VX MT', 'S CVT', 'V CVT', 'VX CVT'],
    'City': ['V', 'VX', 'ZX', 'V CVT', 'VX CVT', 'ZX CVT', 'Hybrid V', 'Hybrid ZX', 'Hybrid e:HEV ZX'],
    'Jazz': ['V', 'VX', 'V CVT', 'VX CVT'],
    'WR-V': ['S', 'V', 'VX', 'S MT', 'V MT', 'VX MT', 'V CVT', 'VX CVT'],
    'Elevate': ['V', 'VX', 'ZX', 'V CVT', 'VX CVT', 'ZX CVT'],
    'BR-V': ['S', 'V', 'VX'],
    'CR-V': ['2WD', 'AWD', '4WD', 'Petrol CVT 2WD', 'Diesel MT 4WD'],
    'HR-V': ['VX CVT'],
    'Civic': ['V CVT', 'VX CVT', 'ZX CVT'],
    'Accord': ['V6 2.4 AT', 'V6 3.5 AT', 'Hybrid'],
  },
  'Toyota': {
    'Glanza': ['E', 'S', 'S AMT', 'G', 'G AMT', 'V', 'V AMT'],
    'Urban Cruiser Hyryder': ['E', 'S', 'G', 'V', 'G AT', 'V AT', 'Hybrid G', 'Hybrid S', 'Hybrid V'],
    'Rumion': ['G MT', 'G AT', 'V AT', 'S MT'],
    'Innova Crysta': ['GX', 'GX AT', 'VX', 'VX AT', 'ZX', 'ZX AT', '2.4 GX', '2.4 VX', '2.4 ZX'],
    'Innova HyCross': ['G HEV AT', 'GX HEV AT', 'VX HEV AT', 'ZX HEV AT', 'GX ICE AT', 'VX ICE AT'],
    'Fortuner': ['2WD MT', '2WD AT', '4WD MT', '4WD AT', 'Legender 2WD AT', 'Legender 4WD AT', 'GR Sport 4WD AT'],
    'Camry': ['Hybrid', 'Hybrid AT'],
    'Land Cruiser': ['300 GX-R', '300 VX-R', '300 ZX'],
    'Vellfire': ['Executive Lounge'],
    'Yaris': ['J', 'G', 'V', 'J CVT', 'G CVT', 'V CVT'],
    'Etios': ['J', 'G', 'V', 'VX', 'GD', 'VD'],
    'Etios Liva': ['J', 'G', 'V', 'VX', 'GD', 'VD'],
    'Corolla Altis': ['J', 'G', 'VX', 'GL'],
    'Prius': ['Z', 'V', 'H'],
    'bZ4X': ['AWD', '2WD'],
  },
  'Kia': {
    'Sonet': ['HTE', 'HTK', 'HTK+', 'HTX', 'HTX+', 'GTX+', 'HTX AT', 'HTX+ AT', 'GTX+ AT', 'GTX+ DCT', 'X Line'],
    'Seltos': ['HTE', 'HTK', 'HTK+', 'HTX', 'HTX+', 'GTX+', 'X Line', 'HTX AT', 'HTX+ AT', 'GTX+ DCT'],
    'Carens': ['Premium', 'Prestige', 'Prestige+', 'Luxury', 'Luxury+', 'Premium AT', 'Prestige AT', 'Luxury AT'],
    'EV6': ['RWD Standard', 'RWD Long Range', 'AWD GT Line'],
    'EV9': ['Air RWD', 'GT Line RWD', 'GT Line AWD'],
    'Carnival': ['Limousine', 'Limousine+', 'Prestige'],
    'Sportage': ['HTK', 'HTX', 'HTX AT'],
  },
  'Renault': {
    'Kwid': ['Std', 'RXE', 'RXL', 'RXT', 'RXT(O)', 'Climber RXT', 'Climber RXT(O)', 'RXT AMT', 'RXT(O) AMT'],
    'Triber': ['RXE', 'RXL', 'RXT', 'RXT AMT', 'RXZ', 'RXZ AMT'],
    'Kiger': ['RXE', 'RXL', 'RXT', 'RXT(O)', 'RXZ', 'RXZ Turbo', 'RXZ Turbo CVT'],
    'Duster': ['RXE', 'RXL', 'RXS', 'RXT', 'RXZ', 'RXZ AT', '4WD RXZ', 'Adventure Edition'],
    'Logan': ['Authentique', 'Preference', 'Expression'],
    'Fluence': ['E4', 'E4 AT'],
    'Scala': ['RxE', 'RxL', 'RxZ'],
    'Pulse': ['RxE', 'RxL', 'RxZ AT'],
  },
  'Volkswagen': {
    'Polo': ['Trendline', 'Comfortline', 'Highline', 'Highline Plus', 'GT TSI', 'GT TDI'],
    'Vento': ['Trendline', 'Comfortline', 'Highline', 'Highline Plus', 'Highline AT'],
    'Taigun': ['Comfortline', 'Highline', 'Topline', 'GT', 'GT Plus'],
    'Virtus': ['Comfortline', 'Highline', 'Topline', 'GT', 'GT Plus'],
    'Tiguan': ['Comfortline', 'Highline', 'AllSpace', '2.0 TSI AT 4Motion'],
    'T-Roc': ['Design', 'Sport'],
    'Passat': ['Comfortline AT', 'Highline AT', 'GTE'],
    'Jetta': ['Comfortline', 'Highline', 'Highline AT'],
    'Touareg': ['V6 TDI'],
  },
  'Skoda': {
    'Rapid': ['Active', 'Ambition', 'Style', 'Monte Carlo'],
    'Slavia': ['Active', 'Ambition', 'Style', 'Monte Carlo'],
    'Kushaq': ['Active', 'Ambition', 'Style', 'Monte Carlo', 'Ambition AT', 'Style AT', 'Monte Carlo AT'],
    'Kodiaq': ['Style AT', 'L&K AT', 'Sportline AT'],
    'Superb': ['Active AT', 'Ambition AT', 'L&K AT', 'Sportline AT', 'Laurin & Klement'],
    'Octavia': ['Ambition', 'Style', 'L&K'],
    'Karoq': ['Style AT'],
    'Fabia': ['Active', 'Ambition', 'Style'],
    'Enyaq': ['60', '80', '80 Coupe', 'iV 80'],
  },
  'MG': {
    'Hector': ['Style', 'Super', 'Smart', 'Sharp', 'Savvy', 'Style AT', 'Super AT', 'Sharp AT'],
    'Hector Plus': ['Style', 'Super', 'Smart', 'Sharp', 'Sharp Pro', 'Sharp AT'],
    'Astor': ['Style', 'Super', 'Smart', 'Sharp', 'Savvy', 'Sharp CVT', 'Savvy CVT'],
    'ZS EV': ['Excite', 'Exclusive', 'Excite Pro', 'Exclusive Pro'],
    'Gloster': ['Super', 'Smart', 'Sharp 4WD', 'Savvy 4WD'],
    'Comet EV': ['Pace', 'Play', 'Pulse'],
    'Windsor EV': ['Excite', 'Exclusive Pro', 'Essence'],
  },
  'Ford': {
    'Figo': ['Ambiente', 'Trend', 'Titanium', 'Titanium+', 'S', 'Titanium AT', 'Freestyle Ambiente', 'Freestyle Trend'],
    'Aspire': ['Ambiente', 'Trend', 'Titanium', 'Titanium+', 'S'],
    'Ecosport': ['Ambiente', 'Trend', 'Titanium', 'Titanium+', 'S', 'Titanium+ S', 'Titanium AT', 'S AT'],
    'Endeavour': ['Trend 2WD AT', 'Titanium 2WD AT', 'Titanium 4WD AT', 'Sport 4WD AT'],
    'Mustang': ['Fastback V8 AT', 'Convertible V8 AT'],
    'Ikon': ['LXI', 'EXI', 'ZXI', 'SXI'],
    'Fusion': ['LXI', 'VXI', 'EXI'],
    'Mondeo': ['LXI', 'GLX', 'Ghia'],
    'S-Max': ['Titanium AT'],
  },
  'Nissan': {
    'Magnite': ['XE', 'XL', 'XV', 'XV Premium', 'XV Premium(O)', 'Turbo XV', 'Turbo XV CVT', 'Turbo XV Premium CVT'],
    'Kicks': ['XL', 'XV', 'XV Premium', 'XV Premium AT'],
    'Terrano': ['XE', 'XL', 'XV', 'XV AT', 'XL D 85', 'XV D 110'],
    'Sunny': ['XE', 'XL', 'XV', 'XV Sunroof', 'XV AT'],
    'Micra': ['XE', 'XL', 'XV', 'XV CVT'],
    'Datsun GO': ['D', 'A', 'T', 'T(O)', 'T CVT'],
    'Datsun GO+': ['D', 'A', 'T', 'T(O)'],
    'X-Trail': ['2WD CVT', '4WD CVT'],
    'Evalia': ['XE', 'XL', 'XV'],
  },
  'Jeep': {
    'Compass': ['Sport', 'Sport+', 'Longitude', 'Longitude+', 'Limited', 'Limited Plus', 'Model S', 'Model S AT', 'Trailhawk 4WD AT'],
    'Meridian': ['Sport', 'Longitude', 'Longitude+', 'Limited', 'Limited Plus', '4WD Limited'],
    'Wrangler': ['Rubicon Unlimited 4WD AT', 'Sahara Unlimited 4WD AT'],
    'Grand Cherokee': ['Limited 4WD AT', 'Overland 4WD AT', '4xe Overland'],
  },
  'BMW': {
    '3 Series': ['320d', '320i', '325i', '330i', 'M340i', '320d Gran Limousine', '330i Gran Limousine'],
    '5 Series': ['520i', '520d', '530i', '530d', 'M550i'],
    '7 Series': ['730Ld', '740Li', '745Le', 'M760Li'],
    'X1': ['sDrive20i', 'sDrive18d', 'xDrive20i', 'SportX sDrive20i'],
    'X3': ['xDrive20i', 'xDrive20d', 'xDrive30i', 'M Sport'],
    'X5': ['xDrive40i', 'xDrive30d', 'xDrive50e'],
    'X7': ['xDrive40i', 'xDrive30d', 'M60i xDrive'],
    'i4': ['eDrive40', 'M50'],
    'iX': ['xDrive40', 'xDrive50', 'M60'],
    'M3': ['Competition', 'xDrive Competition'],
    'M4': ['Competition', 'Competition xDrive'],
    '2 Series': ['220i Gran Coupe M Sport'],
    '6 Series GT': ['620d', '630i', '630d'],
  },
  'Mercedes-Benz': {
    'A-Class': ['A 200d Style', 'A 200 Sport', 'A 35 AMG 4Matic'],
    'C-Class': ['C 200', 'C 220d', 'C 300d', 'C 300', 'AMG C 43'],
    'E-Class': ['E 200', 'E 220d', 'E 350d', 'E 400d', 'AMG E 53'],
    'S-Class': ['S 350d', 'S 450', 'S 500', 'S 580', 'S 680 Maybach'],
    'GLA': ['GLA 200', 'GLA 220d', 'AMG GLA 35'],
    'GLC': ['GLC 200', 'GLC 220d', 'GLC 300d', 'AMG GLC 43'],
    'GLE': ['GLE 300d', 'GLE 450 4Matic', 'GLE 450d 4Matic', 'AMG GLE 53'],
    'GLS': ['GLS 450 4Matic', 'GLS 600 Maybach'],
    'EQS': ['EQS 53 AMG', '450+', '580 4Matic'],
    'EQB': ['EQB 250', 'EQB 350 4Matic'],
    'AMG GT': ['63 S 4Matic+', '53 4Matic+'],
    'V-Class': ['Marco Polo', 'Expression', 'Exclusive'],
    'G-Class': ['G 350d', 'G 500', 'AMG G 63'],
  },
  'Audi': {
    'A4': ['35 TDI Premium', '40 TFSI Premium Plus', '45 TFSI Technology'],
    'A6': ['45 TFSI Technology', '40 TDI Technology', '45 TFSI'],
    'A8': ['L 55 TFSI', '60 TFSI e'],
    'Q3': ['35 TDI Premium', '40 TFSI Premium Plus', '45 TFSI'],
    'Q5': ['40 TDI Premium Plus', '45 TFSI Technology', 'SQ5'],
    'Q7': ['45 TDI Technology', '55 TFSI Technology'],
    'Q8': ['55 TFSI Technology', 'SQ8', 'RS Q8'],
    'e-tron': ['55 quattro Technology', 'GT quattro Technology', 'RS e-tron GT'],
    'R8': ['V10 Performance', 'V10 Spyder'],
    'S5': ['Sportback TDI', 'Sportback TFSI'],
    'RS5': ['Sportback'],
    'TT': ['TTS Coupe', 'TT RS'],
  },
  'Volvo': {
    'XC40': ['B4 R-Design', 'Recharge Plus', 'Recharge Ultimate'],
    'XC60': ['B4 R-Design', 'B5 R-Design', 'Recharge Plus', 'Recharge Ultimate'],
    'XC90': ['B5 R-Design', 'B6 Inscription', 'Recharge Ultimate'],
    'S60': ['T4 R-Design', 'B4 R-Design'],
    'S90': ['T8 Inscription Expression', 'B6 Inscription'],
    'C40 Recharge': ['Single', 'Twin'],
    'EX90': ['Twin Performance'],
  },
  'Jaguar': {
    'XE': ['Premium', 'Prestige', 'R-Dynamic', 'R-Dynamic SE'],
    'XF': ['Premium', 'Prestige', 'R-Dynamic', 'R-Dynamic SE'],
    'F-Pace': ['Premium', 'Prestige', 'R-Dynamic', 'SVR'],
    'I-Pace': ['EV400 SE', 'EV400 HSE'],
    'E-Pace': ['R-Dynamic SE', 'R-Dynamic HSE'],
  },
  'Land Rover': {
    'Range Rover': ['D350 SE', 'P400 SE', 'P530 Autobiography', 'SV Bespoke'],
    'Range Rover Sport': ['Dynamic SE', 'Autobiography', 'P530 First Edition'],
    'Range Rover Evoque': ['R-Dynamic S', 'R-Dynamic SE', 'R-Dynamic HSE'],
    'Range Rover Velar': ['R-Dynamic S', 'R-Dynamic SE'],
    'Defender': ['90 X-Dynamic SE', '90 Carpathian Edition', '110 X', '110 Autobiography'],
    'Discovery': ['S D300', 'SE D300', 'HSE D300', 'Metropolitan Edition'],
    'Freelander 2': ['SE TD4', 'HSE TD4'],
  },
  'Porsche': {
    'Cayenne': ['S AT', 'E-Hybrid AT', 'GTS AT', 'Turbo AT', 'Turbo S E-Hybrid'],
    'Macan': ['S AT', 'GTS AT', 'Electric'],
    '911': ['Carrera AT', 'Carrera S AT', 'Carrera 4S AT', 'Turbo AT', 'Turbo S AT', 'GT3'],
    'Taycan': ['4S', 'Turbo', 'Turbo S', 'Cross Turismo 4S', 'Sport Turismo Turbo'],
    'Panamera': ['4 E-Hybrid', '4S E-Hybrid', 'Turbo S E-Hybrid'],
  },
  'Citroen': {
    'C3': ['Live', 'Feel', 'Shine'],
    'C3 Aircross': ['Feel', 'Shine'],
    'C5 Aircross': ['Feel', 'Shine', 'Feel AT', 'Shine AT'],
    'eC3': ['Feel', 'Shine'],
  },
  'Ola': {
    'S1': ['S1 Air', 'S1 X', 'S1', 'S1 Pro', 'S1 X+'],
  },
  'Other': {
    'Other': ['Other'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FUEL / TRANSMISSION
// ─────────────────────────────────────────────────────────────────────────────
const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: '⛽ Petrol' },
  { value: 'diesel', label: '🛢️ Diesel' },
  { value: 'electric', label: '⚡ Electric' },
  { value: 'hybrid', label: '🔋 Hybrid / Strong Hybrid' },
  { value: 'cng', label: '💨 CNG / CNG+Petrol' },
];

const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: 'manual', label: 'Manual (MT)' },
  { value: 'automatic', label: 'Automatic (AT / CVT / DCT)' },
  { value: 'amt', label: 'AMT / iAMT / iMT' },
];

// Year range: current year down to 2000
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

// Indian cities
const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
  'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Kalyan', 'Vasai-Virar', 'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur',
  'Amritsar', 'Raipur', 'Allahabad', 'Coimbatore', 'Vijayawada', 'Madurai', 'Kochi', 'Chandigarh',
  'Guwahati', 'Solapur', 'Hubli', 'Tiruchirappalli', 'Bareilly', 'Mysore', 'Tiruppur', 'Gurgaon',
  'Noida', 'Navi Mumbai', 'Other',
];

interface Props { onSubmit: (data: VehicleInfo) => void; }

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VehicleInfoForm({ onSubmit }: Props) {
  const [form, setForm] = useState<VehicleInfo>({
    make: '', model: '', variant: '', year: CURRENT_YEAR - 3,
    fuelType: 'petrol', transmission: 'manual',
    mileageKm: 40000, askingPrice: 600000, currency: 'INR', location: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleInfo, string>>>({});

  // Derived lists — cascade on selection
  const makeList = useMemo(() => Object.keys(CAR_DB).sort(), []);
  const modelList = useMemo(() =>
    form.make && CAR_DB[form.make] ? Object.keys(CAR_DB[form.make]).sort() : [],
    [form.make]);
  const variantList = useMemo(() =>
    form.make && form.model && CAR_DB[form.make]?.[form.model]
      ? CAR_DB[form.make][form.model]
      : [],
    [form.make, form.model]);

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, make: e.target.value, model: '', variant: '' }));
    setErrors(er => ({ ...er, make: '' }));
  };
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, model: e.target.value, variant: '' }));
    setErrors(er => ({ ...er, model: '' }));
  };
  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, variant: e.target.value }));
  };

  const set = (field: keyof VehicleInfo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof VehicleInfo, string>> = {};
    if (!form.make)  e.make  = 'Please select a make.';
    if (!form.model) e.model = 'Please select a model.';
    if (!form.year)  e.year  = 'Year is required.';
    if (form.mileageKm < 0)   e.mileageKm   = 'Mileage cannot be negative.';
    if (form.askingPrice <= 0) e.askingPrice = 'Asking price must be positive.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const ageYrs = form.year ? CURRENT_YEAR - form.year : null;

  // ── Select wrapper styles ──────────────────────────────────────────
  const selectWrap: React.CSSProperties = { position: 'relative' };
  const chevStyle: React.CSSProperties = {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: 'var(--color-text-muted)',
  };
  const disabledSelect: React.CSSProperties = { opacity: 0.5, cursor: 'not-allowed' };

  return (
    <div className="card-elevated" style={{ padding: 'var(--space-8)' }}>
      <h2 className="heading-md" style={{ marginBottom: 'var(--space-2)' }}>Vehicle Information</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
        Select the car details from the dropdowns for best AI accuracy. All fields marked <span style={{ color: 'var(--color-primary-light)' }}>*</span> are required.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>

          {/* ── Make ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-make">Make *</label>
            <div style={selectWrap}>
              <select id="vif-make" className="form-select" value={form.make} onChange={handleMakeChange}
                style={{ paddingRight: 36 }}>
                <option value="">— Select Make —</option>
                {makeList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
            {errors.make && <span className="form-error">{errors.make}</span>}
          </div>

          {/* ── Model ────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-model">
              Model * {!form.make && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize:'0.78rem' }}>(select make first)</span>}
            </label>
            <div style={selectWrap}>
              <select id="vif-model" className="form-select" value={form.model}
                onChange={handleModelChange}
                disabled={!form.make}
                style={{ paddingRight: 36, ...(!form.make ? disabledSelect : {}) }}>
                <option value="">{form.make ? `— Select ${form.make} Model —` : '— Select Make First —'}</option>
                {modelList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
            {errors.model && <span className="form-error">{errors.model}</span>}
          </div>

          {/* ── Variant ──────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-variant">
              Variant{' '}
              {!form.model
                ? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize:'0.78rem' }}>(select model first)</span>
                : <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>}
            </label>
            <div style={selectWrap}>
              <select id="vif-variant" className="form-select" value={form.variant}
                onChange={handleVariantChange}
                disabled={!form.model || variantList.length === 0}
                style={{ paddingRight: 36, ...(!form.model ? disabledSelect : {}) }}>
                <option value="">{form.model && variantList.length ? `— Select Variant —` : '— Select Model First —'}</option>
                {variantList.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
          </div>

          {/* ── Year ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-year">Manufacturing Year *</label>
            <div style={selectWrap}>
              <select id="vif-year" className="form-select" value={form.year} onChange={set('year')}
                style={{ paddingRight: 36 }}>
                {YEARS.map(y => (
                  <option key={y} value={y}>
                    {y}{y === CURRENT_YEAR ? ' (Current)' : y === CURRENT_YEAR - 1 ? ' (Last Year)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
          </div>

          {/* ── Fuel Type ────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-fuel">Fuel Type *</label>
            <div style={selectWrap}>
              <select id="vif-fuel" className="form-select" value={form.fuelType} onChange={set('fuelType')}
                style={{ paddingRight: 36 }}>
                {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
          </div>

          {/* ── Transmission ─────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-tx">Transmission *</label>
            <div style={selectWrap}>
              <select id="vif-tx" className="form-select" value={form.transmission} onChange={set('transmission')}
                style={{ paddingRight: 36 }}>
                {TRANSMISSIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={15} style={chevStyle} />
            </div>
          </div>

          {/* ── Mileage ──────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-km">Odometer Reading (km) *</label>
            <input id="vif-km" type="number" className="form-input"
              min={0} max={999999} step={1000}
              value={form.mileageKm} onChange={set('mileageKm')} />
            {errors.mileageKm && <span className="form-error">{errors.mileageKm}</span>}
            {form.mileageKm > 0 && ageYrs && ageYrs > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                ≈ {Math.round(form.mileageKm / ageYrs).toLocaleString('en-IN')} km/year
              </span>
            )}
          </div>

          {/* ── Asking Price ─────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label" htmlFor="vif-price">
              Asking Price (₹) * <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>Seller's price</span>
            </label>
            <input id="vif-price" type="number" className="form-input"
              min={0} step={5000}
              value={form.askingPrice} onChange={set('askingPrice')} />
            {errors.askingPrice && <span className="form-error">{errors.askingPrice}</span>}
            {form.askingPrice > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                ₹{form.askingPrice.toLocaleString('en-IN')}
                {form.askingPrice >= 100000 && ` (₹${(form.askingPrice / 100000).toFixed(2)} Lakh)`}
              </span>
            )}
          </div>
        </div>

        {/* ── Location ─────────────────────────────────────────── */}
        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label" htmlFor="vif-location">
            City / Location <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — helps price accuracy)</span>
          </label>
          <div style={selectWrap}>
            <select id="vif-location" className="form-select" value={form.location}
              onChange={set('location')} style={{ paddingRight: 36 }}>
              <option value="">— Select City —</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} style={chevStyle} />
          </div>
        </div>

        {/* ── Summary Preview ──────────────────────────────────── */}
        {form.make && form.model && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            padding: 'var(--space-4)', background: 'var(--color-surface-3)',
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)',
            borderLeft: '3px solid var(--color-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <Info size={14} color="var(--color-primary-light)" />
              <strong style={{ color: 'var(--color-text-primary)' }}>
                {form.make} {form.model}{form.variant ? ` ${form.variant}` : ''}
              </strong>
              {form.year && <span>· {form.year}</span>}
              {ageYrs !== null && ageYrs >= 0 && <span>· {ageYrs === 0 ? 'New' : `${ageYrs}yr old`}</span>}
              {form.fuelType && <span>· {FUEL_TYPES.find(f => f.value === form.fuelType)?.label.replace(/[⛽🛢️⚡🔋💨] /, '')}</span>}
              {form.mileageKm > 0 && <span>· {form.mileageKm.toLocaleString('en-IN')} km</span>}
              {form.askingPrice > 0 && (
                <span>· <strong style={{ color: 'var(--color-accent)' }}>₹{(form.askingPrice / 100000).toFixed(2)} L</strong></span>
              )}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full btn-lg">
          Continue to Image Upload <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
