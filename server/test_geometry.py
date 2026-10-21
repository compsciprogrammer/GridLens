import unittest
import numpy as np
from geometry import measure,point_to_infinite_line
class GeometryTests(unittest.TestCase):
    def test_gap(self):
        a=np.zeros((100,100),np.uint8);b=a.copy();a[20:81,20]=255;b[40:61,30:51]=255
        r=measure(a,b)
        self.assertAlmostEqual(r['pixel_gap'],10.0,places=2)
        self.assertIsNone(r['physical_clearance_ft'])
    def test_overlap(self):
        a=np.zeros((100,100),np.uint8);b=a.copy();a[30:70,30]=255;b[40:60,20:40]=255
        self.assertEqual(measure(a,b)['pixel_gap'],0)
    def test_missing(self):
        a=np.zeros((100,100),np.uint8)
        self.assertIsNone(measure(a,a)['pixel_gap'])
    def test_infinite_line(self):
        self.assertAlmostEqual(point_to_infinite_line(3,4,1,0,-1),2)
if __name__=='__main__':unittest.main()
