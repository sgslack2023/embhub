"""
PDF Processing Utilities for Shipping Labels

This module handles OCR and address extraction from shipping label PDFs.
Supports multiple shipping carriers with different label formats:
- USPS (Priority Mail, etc.)
- FedEx (Express, Ground, etc.)
- UPS (Ground, Express, etc.)

The identifier for matching remains the same: shipping address
Different carriers have different label layouts, so carrier-specific
pattern matching is used for optimal address extraction.
"""

import os
import tempfile
from io import BytesIO
from typing import List, Dict, Tuple, Optional
import re
from difflib import SequenceMatcher

try:
    # Option 1: PyMuPDF (simpler setup, no poppler needed)
    import fitz  # PyMuPDF
    from PIL import Image
    import pytesseract
    import cv2
    import numpy as np
    PDF_LIBRARY = "pymupdf"
except ImportError:
    try:
        # Option 2: Original approach with pdf2image
        import PyPDF2
        from PIL import Image
        from pdf2image import convert_from_path
        import pytesseract
        import cv2
        import numpy as np
        PDF_LIBRARY = "pdf2image"
    except ImportError as e:
        print(f"Missing required packages: {e}")
        print("Install PyMuPDF (easier): pip install PyMuPDF pytesseract opencv-python")
        print("OR install pdf2image: pip install PyPDF2 Pillow pdf2image pytesseract opencv-python")
        PDF_LIBRARY = None


class PDFProcessor:
    """Handles PDF processing for shipping labels"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def extract_pages_from_pdf(self, pdf_path: str) -> List[str]:
        """
        Split PDF into individual pages and return list of image paths
        """
        try:
            if PDF_LIBRARY == "pymupdf":
                return self._extract_pages_pymupdf(pdf_path)
            elif PDF_LIBRARY == "pdf2image":
                return self._extract_pages_pdf2image(pdf_path)
            else:
                print("❌ No PDF library available. Please install PyMuPDF or pdf2image")
                print("Run: pip install PyMuPDF pytesseract opencv-python")
                raise Exception("No PDF library available. Install PyMuPDF: pip install PyMuPDF pytesseract opencv-python")
        except Exception as e:
            print(f"Error extracting pages from PDF: {str(e)}")
            return []
    
    def _extract_pages_pymupdf(self, pdf_path: str) -> List[str]:
        """Extract pages using PyMuPDF (no poppler needed)"""
        page_paths = []
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            # Convert to image with high DPI for better OCR
            mat = fitz.Matrix(3.0, 3.0)  # 3x zoom = ~216 DPI
            pix = page.get_pixmap(matrix=mat)
            
            page_path = os.path.join(self.temp_dir, f"page_{page_num+1}.png")
            pix.save(page_path)
            page_paths.append(page_path)
        
        doc.close()
        return page_paths
    
    def _extract_pages_pdf2image(self, pdf_path: str) -> List[str]:
        """Extract pages using pdf2image (requires poppler)"""
        pages = convert_from_path(pdf_path, dpi=300)
        page_paths = []
        
        for i, page in enumerate(pages):
            page_path = os.path.join(self.temp_dir, f"page_{i+1}.png")
            page.save(page_path, 'PNG')
            page_paths.append(page_path)
        
        return page_paths
    
    def extract_text_from_image(self, image_path: str) -> str:
        """
        Extract text from image using OCR
        """
        try:
            print(f"=== OCR PROCESSING ===")
            print(f"Processing image: {image_path}")
            
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                print(f"Failed to load image: {image_path}")
                return ""
            
            print(f"Image loaded successfully, shape: {image.shape}")
            
            # Convert to grayscale for better OCR
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply some preprocessing for better OCR results
            # Increase contrast
            alpha = 1.5  # Contrast control
            beta = 0     # Brightness control
            enhanced = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
            
            # Apply threshold to get better text recognition
            _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            print("Image preprocessing completed")
            
            # Use pytesseract to extract text with optimized config for shipping labels
            # Removed whitelist to better capture FedEx and USPS labels
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(thresh, config=custom_config)
            
            print(f"OCR completed, extracted text length: {len(text)}")
            print(f"Raw OCR text (first 500 chars):\n{text[:500]}")
            if len(text) > 500:
                print(f"... (truncated, total length: {len(text)} chars)")
            
            return text.strip()
            
        except Exception as e:
            print(f"Error extracting text from image: {str(e)}")
            import traceback
            traceback.print_exc()
            return ""
    
    def detect_label_type(self, text: str) -> str:
        """
        Detect if this is a USPS, FedEx, or UPS label
        """
        text_upper = text.upper()
        
        # Check for UPS indicators (check first as it's very specific)
        if any(indicator in text_upper for indicator in ['UPS GROUND', 'UPS EXPRESS', 'UPS NEXT DAY', 'UPS 2ND DAY', 'TRACKING #: 1Z']):
            print("📦 Detected: UPS label")
            return 'UPS'
        
        # Check for FedEx indicators
        if any(indicator in text_upper for indicator in ['FEDEX', 'FEDEX EXPRESS', 'FEDEX GROUND', 'SS LBBA', 'TX-US LBB']):
            print("📦 Detected: FedEx label")
            return 'FEDEX'
        
        # Check for USPS indicators
        if any(indicator in text_upper for indicator in ['USPS', 'PRIORITY MAIL', 'US POSTAL']):
            print("📦 Detected: USPS label")
            return 'USPS'
        
        # Default to USPS if can't determine
        print("📦 Unable to detect carrier, defaulting to USPS")
        return 'USPS'
    
    def extract_shipping_address(self, text: str) -> str:
        """
        Extract shipping address from OCR text using pattern matching
        Handles USPS, FedEx, and UPS label formats
        """
        try:
            print(f"=== EXTRACTING ADDRESS FROM TEXT ===")
            print(f"Raw OCR text:\n{text}")
            print("=" * 50)
            
            # Detect label type
            label_type = self.detect_label_type(text)
            
            # Define patterns based on label type
            if label_type == 'UPS':
                print("Using UPS-specific address extraction patterns")
                address_patterns = [
                    # UPS Pattern 1: After "SHIP TO:" until next section (UPS GROUND, TRACKING, barcode)
                    r'SHIP\s*TO\s*:?\s*(.*?)(?=\n\s*(?:UPS|TRACKING|CA \d{3}|1Z)|\Z)',
                    
                    # UPS Pattern 2: Name, street, city/state/zip before UPS GROUND
                    r'([A-Z][A-Z\s]{3,}[^\n]*\n\d+[^\n]+\n[^\n]*[A-Z]{2}\s+\d{5}(?:-\d{4})?)',
                    
                    # UPS Pattern 3: Between SHIP TO and barcode/tracking area
                    r'SHIP\s*TO\s*:?\s*([^\n]+\n[^\n]+\n[^\n]+[A-Z]{2}\s+\d{5})',
                    
                    # UPS Pattern 4: Everything after "TO:" before UPS markers
                    r'(?:^|\n)\s*TO\s*:?\s*(.*?)(?=\n\s*(?:UPS|TRACKING|CA \d{3}))',
                ]
            elif label_type == 'FEDEX':
                print("Using FedEx-specific address extraction patterns")
                address_patterns = [
                    # FedEx Pattern 1: After "TO" at the start, before REF/DEPT/PO
                    r'(?:^|\n)\s*TO\s+([A-Z][^\n]+\n[^\n]*\d+[^\n]+\n[^\n]*[A-Z]{2}\s+\d{5})',
                    
                    # FedEx Pattern 2: Name on one line, then address components
                    r'(?:^|\n)([A-Z][A-Z\s]{5,}[^\n]*\n\d+[^\n]+\n[^\n]*[A-Z]{2}\s+\d{5})',
                    
                    # FedEx Pattern 3: Between "TO" and other fields (REF, DEPT, PO)
                    r'TO\s+(.*?)(?=\n\s*(?:REF|DEPT|PO|TRACKING))',
                    
                    # FedEx Pattern 4: Look for pattern with street number and ZIP
                    r'([A-Z][A-Z\s]{3,}[^\n]*\n[^\n]*\d+[^\n]*(?:ST|DR|AVE|RD|BLVD|LN)[^\n]*\n[^\n]*[A-Z]{2}\s+\d{5})',
                    
                    # FedEx Pattern 5: Simple name-street-city pattern
                    r'([A-Z][A-Z\s]+[^\n]{5,}\n\d+[^\n]+\n[A-Z\s]+[A-Z]{2}\s+\d{5})',
                ]
            else:  # USPS patterns
                print("Using USPS address extraction patterns")
                address_patterns = [
                    # USPS Pattern 1: Everything after "SHIP TO:" until next section
                    r'SHIP\s*TO\s*:?\s*(.*?)(?=\n\s*(?:USPS|TRACKING|PRIORITY|FROM|Delivery|Return|Service)|\Z)',
                    
                    # USPS Pattern 2: Everything after "TO:" 
                    r'(?:^|\n)\s*TO\s*:?\s*(.*?)(?=\n\s*(?:USPS|TRACKING|PRIORITY|FROM|Delivery|Return|Service)|\Z)',
                    
                    # USPS Pattern 3: Simple 3-line address (most common)
                    r'([A-Za-z][^\n]{8,}\n[^\n]*\d+[^\n]{5,}\n[^\n]*[A-Z]{2}\s+\d{5})',
                    
                    # USPS Pattern 4: Any text block with name, street number, and ZIP
                    r'([A-Za-z][A-Za-z\s]{3,}[^\n]*\n.*?\d+.*?\n.*?[A-Z]{2}\s+\d{5}(?:-\d{4})?)',
                ]
            
            # Common patterns that work for both
            common_patterns = [
                # Pattern: Flexible address with ZIP (work backwards from ZIP)
                r'([^\n]*\n[^\n]*\n[^\n]*[A-Z]{2}\s+\d{5}(?:-\d{4})?)',
                
                # Pattern: Very loose - any multi-line text with numbers and letters
                r'([A-Za-z][^\n]{10,}\n[^\n]{10,}\n[^\n]{10,})',
            ]
            
            # Combine patterns
            all_patterns = address_patterns + common_patterns
            
            for i, pattern in enumerate(all_patterns, 1):
                print(f"Trying pattern {i}: {pattern[:80]}...")
                match = re.search(pattern, text, re.DOTALL | re.MULTILINE | re.IGNORECASE)
                if match:
                    address = match.group(1).strip()
                    print(f"Pattern {i} matched: '{address}'")
                    
                    # Clean up the address
                    address = re.sub(r'\s+', ' ', address)  # Multiple spaces to single
                    address = re.sub(r'\n\s*\n', '\n', address)  # Multiple newlines to single
                    
                    # Remove common label artifacts based on carrier
                    if label_type == 'FEDEX':
                        # Remove FedEx-specific artifacts
                        address = re.sub(r'(?i)(REF|DEPT|PO|TRACKING).*', '', address, flags=re.MULTILINE)
                    elif label_type == 'UPS':
                        # Remove UPS-specific artifacts
                        address = re.sub(r'(?i)(UPS GROUND|UPS EXPRESS|TRACKING #|CA \d{3}|1Z).*', '', address, flags=re.MULTILINE)
                    
                    address = address.strip()
                    
                    # Basic validation - must have reasonable length
                    if len(address) > 10:  # Lowered from 15 to 10
                        # Additional validation: must have at least 2 lines
                        if '\n' in address or len(address) > 30:
                            print(f"✓ Valid address found: '{address}'")
                            return address
                        else:
                            print(f"✗ Address too short or single line: '{address}'")
                    else:
                        print(f"✗ Address too short: '{address}' (length: {len(address)})")
            
            # Fallback: Try to extract any text that looks like an address
            lines = text.split('\n')
            address_lines = []
            
            # Skip list - add carrier-specific terms
            skip_terms = ['USPS', 'PRIORITY', 'MAIL', 'TRACKING', 'ATFM', 'POSTAGE', 
                         'FEDEX', 'EXPRESS', 'REF', 'DEPT', 'SHIP DATE', 'ACT', 'CAD',
                         'BILL SENDER', 'TRK#',
                         'UPS', 'UPS GROUND', 'UPS EXPRESS', 'TRACKING #', '1Z Y00', '1Z']
            
            for line in lines:
                line = line.strip()
                # Skip headers and tracking info
                if any(skip in line.upper() for skip in skip_terms):
                    continue
                # Look for lines that might be address components
                if re.search(r'[A-Za-z]', line) and len(line) > 3:
                    address_lines.append(line)
            
            if len(address_lines) >= 2:
                fallback_address = '\n'.join(address_lines[:4])  # Take first 4 lines
                print(f"Fallback address extraction: '{fallback_address}'")
                return fallback_address
            
            print("No address pattern matched")
            return ""
            
        except Exception as e:
            print(f"Error extracting shipping address: {str(e)}")
            return ""
    
    def process_shipping_label_page(self, image_path: str) -> Dict:
        """
        Process a single shipping label page and extract shipping address using OCR
        """
        # Extract text from image using OCR
        text = self.extract_text_from_image(image_path)
        
        # Extract shipping address from OCR text
        shipping_address = self.extract_shipping_address(text)
        
        return {
            'text': text,
            'shipping_address': shipping_address,
            'image_path': image_path
        }
    
    def calculate_address_similarity(self, address1: str, address2: str) -> float:
        """
        Calculate similarity between two addresses with focus on key components
        """
        if not address1 or not address2:
            return 0.0
        
        print(f"    Comparing:")
        print(f"    Address 1: '{address1}'")
        print(f"    Address 2: '{address2}'")
        
        # Normalize addresses for comparison
        addr1_normalized = re.sub(r'[^\w\s]', ' ', address1.lower())
        addr2_normalized = re.sub(r'[^\w\s]', ' ', address2.lower())
        
        addr1_normalized = re.sub(r'\s+', ' ', addr1_normalized).strip()
        addr2_normalized = re.sub(r'\s+', ' ', addr2_normalized).strip()
        
        # Overall similarity
        overall_similarity = SequenceMatcher(None, addr1_normalized, addr2_normalized).ratio()
        
        # Extract key components for weighted comparison
        def extract_name(addr):
            # Try to get the first line (usually the name)
            lines = addr.split('\n')
            if lines:
                return lines[0].strip().lower()
            return addr.lower()
        
        def extract_street_number(addr):
            # Extract street numbers
            numbers = re.findall(r'\b\d+\b', addr)
            return ' '.join(numbers)
        
        def extract_zip_code(addr):
            # Extract ZIP codes
            zip_match = re.search(r'\b\d{5}(?:-\d{4})?\b', addr)
            return zip_match.group() if zip_match else ''
        
        # Component similarities
        name1, name2 = extract_name(address1), extract_name(address2)
        name_similarity = SequenceMatcher(None, name1, name2).ratio() if name1 and name2 else 0.0
        
        street1, street2 = extract_street_number(address1), extract_street_number(address2)
        street_similarity = 1.0 if street1 and street2 and street1 == street2 else 0.0
        
        zip1, zip2 = extract_zip_code(address1), extract_zip_code(address2)
        zip_similarity = 1.0 if zip1 and zip2 and zip1 == zip2 else 0.0
        
        # Weighted final score (heavily favor name matching for ship-to)
        final_score = (
            name_similarity * 0.7 +      # 70% weight on name matching (increased!)
            overall_similarity * 0.2 +   # 20% weight on overall similarity  
            street_similarity * 0.05 +   # 5% weight on street number
            zip_similarity * 0.05        # 5% weight on ZIP code
        )
        
        print(f"    Name similarity: {name_similarity:.3f} ('{name1}' vs '{name2}')")
        print(f"    Street similarity: {street_similarity:.3f} ('{street1}' vs '{street2}')")
        print(f"    ZIP similarity: {zip_similarity:.3f} ('{zip1}' vs '{zip2}')")
        print(f"    Overall similarity: {overall_similarity:.3f}")
        print(f"    Final weighted score: {final_score:.3f}")
        
        return final_score
    
    def check_address_in_ocr(self, packing_address: str, ocr_normalized: str) -> float:
        """
        Check if packing slip address components appear in OCR text
        """
        if not packing_address:
            return 0.0
            
        # Normalize the packing slip address
        address_normalized = re.sub(r'[^\w\s]', ' ', packing_address.lower())
        address_normalized = re.sub(r'\s+', ' ', address_normalized).strip()
        
        # Split address into lines and extract key components
        address_lines = [line.strip() for line in packing_address.split('\n') if line.strip()]
        
        total_score = 0.0
        components_found = 0
        
        print(f"    Checking address components:")
        
        for i, line in enumerate(address_lines):
            line_normalized = re.sub(r'[^\w\s]', ' ', line.lower())
            line_normalized = re.sub(r'\s+', ' ', line_normalized).strip()
            
            if len(line_normalized) < 3:
                continue
                
            # Check if this line appears in OCR text
            if line_normalized in ocr_normalized:
                components_found += 1
                if i == 0:  # First line (usually name) gets higher weight
                    score_weight = 0.6
                else:
                    score_weight = 0.4
                total_score += score_weight
                print(f"      ✅ Found: '{line}' (weight: {score_weight})")
            else:
                # Check for partial matches (individual words)
                words = [w for w in line_normalized.split() if len(w) > 2]
                words_found = sum(1 for word in words if word in ocr_normalized)
                if words_found > 0:
                    partial_score = (words_found / len(words)) * 0.3  # Partial match gets lower score
                    total_score += partial_score
                    components_found += 1
                    print(f"      🔸 Partial: '{line}' ({words_found}/{len(words)} words, score: {partial_score:.2f})")
                else:
                    print(f"      ❌ Missing: '{line}'")
        
        # Calculate final score
        if components_found > 0:
            final_score = total_score / len(address_lines)  # Average score per component
        else:
            final_score = 0.0
            
        return final_score
    
    def find_best_matching_packing_slip(self, ocr_text: str, packing_slips: List[Dict]) -> Tuple[Optional[int], float]:
        """
        Simple approach: Check if any packing slip address appears in the OCR text.
        Works with USPS, FedEx, and UPS labels.
        """
        if not packing_slips:
            print("No packing slips available for matching")
            return None, 0.0
        
        if not ocr_text or len(ocr_text.strip()) < 10:
            print(f"OCR text too short or empty: '{ocr_text[:50]}...'")
            return None, 0.0
        
        # Detect label type for better matching
        label_type = self.detect_label_type(ocr_text)
        
        print(f"=== ADDRESS MATCHING ({label_type} Label) ===")
        print(f"OCR text length: {len(ocr_text)} characters")
        print(f"Checking if any of {len(packing_slips)} packing slip addresses appear in OCR text...")
        
        # Normalize OCR text for better matching
        ocr_normalized = re.sub(r'[^\w\s]', ' ', ocr_text.lower())
        ocr_normalized = re.sub(r'\s+', ' ', ocr_normalized).strip()
        
        best_match_id = None
        best_score = 0.0
        
        for packing_slip in packing_slips:
            if not packing_slip.get('ship_to'):
                print(f"Skipping packing slip {packing_slip['id']} (Order: {packing_slip.get('order_id', 'N/A')}) - no shipping address")
                continue
            
            packing_address = packing_slip['ship_to']
            print(f"\nChecking packing slip {packing_slip['id']} (Order: {packing_slip.get('order_id', 'N/A')}):")
            print(f"  Address: '{packing_address}'")
            
            # Check if key parts of packing slip address appear in OCR text
            score = self.check_address_in_ocr(packing_address, ocr_normalized)
            
            print(f"  Match score: {score:.3f}")
            
            if score > best_score:
                best_score = score
                best_match_id = packing_slip['id']
        
        # Adaptive threshold based on label type
        # Different carriers have different OCR quality and layouts
        if label_type == 'FEDEX':
            minimum_threshold = 0.25  # Lower threshold for FedEx
            print(f"Using FedEx threshold: {minimum_threshold}")
        elif label_type == 'UPS':
            minimum_threshold = 0.28  # Slightly lower threshold for UPS
            print(f"Using UPS threshold: {minimum_threshold}")
        else:
            minimum_threshold = 0.3   # Standard threshold for USPS
            print(f"Using USPS threshold: {minimum_threshold}")
        
        if best_score >= minimum_threshold:
            print(f"\n✅ MATCHED: Packing slip {best_match_id} with score {best_score:.3f}")
            return best_match_id, best_score
        else:
            print(f"\n❌ NO MATCH: Best score {best_score:.3f} below threshold {minimum_threshold}")
            return None, 0.0
    
    def process_shipping_labels_pdf(self, pdf_path: str, packing_slips: List[Dict], google_drive_file_link: str) -> List[Dict]:
        """
        Process a PDF containing shipping labels and match them to packing slips.
        Supports USPS, FedEx, and UPS label formats.
        No file splitting - just extract text for address matching and store Google Drive link with page numbers.
        """
        results = []
        
        try:
            print(f"\n{'='*80}")
            print(f"📦 PROCESSING SHIPPING LABELS PDF")
            print(f"{'='*80}")
            
            # Extract pages from PDF as images for OCR only (temporary)
            page_paths = self.extract_pages_from_pdf(pdf_path)
            print(f"Extracted {len(page_paths)} page(s) from PDF")
            
            for page_num, page_path in enumerate(page_paths, 1):
                print(f"\n{'─'*80}")
                print(f"📄 Processing page {page_num}/{len(page_paths)}...")
                print(f"{'─'*80}")
                
                # Process each page using OCR on the image
                page_data = self.process_shipping_label_page(page_path)
                
                # Detect label type
                label_type = self.detect_label_type(page_data['text'])
                
                print(f"✓ OCR text extracted from page {page_num}")
                print(f"✓ Label Type: {label_type}")
                print(f"✓ Extracted shipping address: {page_data['shipping_address']}")
                
                # Find matching packing slip using full OCR text (already filtered by folder)
                print(f"\n🔍 Matching against {len(packing_slips)} packing slips from same folder...")
                packing_slip_id, confidence_score = self.find_best_matching_packing_slip(
                    page_data['text'],  # Use full OCR text instead of just extracted address
                    packing_slips
                )
                
                result = {
                    'page_number': page_num,
                    'google_drive_file_link': google_drive_file_link,  # Store Google Drive link instead of local file
                    'shipping_address': page_data['shipping_address'],
                    'packing_slip_id': packing_slip_id,
                    'confidence_score': confidence_score,
                    'matched': packing_slip_id is not None,
                    'label_type': label_type  # Store label type for debugging
                }
                
                results.append(result)
                
                if result['matched']:
                    print(f"✅ Page {page_num} ({label_type}) - MATCHED to packing slip {packing_slip_id}")
                else:
                    print(f"❌ Page {page_num} ({label_type}) - NO MATCH FOUND")
            
            print(f"\n{'='*80}")
            print(f"📊 PROCESSING COMPLETE")
            print(f"Total pages: {len(results)}")
            print(f"Matched: {sum(1 for r in results if r['matched'])}")
            print(f"Unmatched: {sum(1 for r in results if not r['matched'])}")
            print(f"{'='*80}\n")
        
        except Exception as e:
            print(f"Error processing shipping labels PDF: {str(e)}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Clean up temporary files (no permanent files created)
            self.cleanup_temp_files()
        
        return results
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            import shutil
            if os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
        except Exception as e:
            print(f"Error cleaning up temp files: {str(e)}")
