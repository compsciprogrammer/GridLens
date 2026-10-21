"""Conductor-to-canopy 2D geometry; never converts pixels to feet without depth validation."""
import cv2
import numpy as np

def measure(line_mask, vegetation_mask, frame=None):
    line=(np.asarray(line_mask)>0).astype(np.uint8)
    veg=(np.asarray(vegetation_mask)>0).astype(np.uint8)
    if line.shape != veg.shape or line.ndim!=2:
        raise ValueError("Masks must be matching 2D arrays")
    if not line.any() or not veg.any():
        return {'pixel_gap':None,'screening_proximity':'Unassessed','distance_method':'mask-to-mask-euclidean','measurement_points':None}
    contours,_=cv2.findContours(veg,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    boundary=np.zeros_like(veg)
    cv2.drawContours(boundary,contours,-1,255,1)
    # Euclidean distance to the actual segmented conductor pixels, not an infinite line.
    # DIST_MASK_PRECISE gives Euclidean rather than the approximate chamfer metric.
    dt=cv2.distanceTransform((1-line)*255,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
    ys,xs=np.where(boundary>0)
    distances=dt[ys,xs]
    idx=int(np.argmin(distances))
    x0,y0=int(xs[idx]),int(ys[idx]); d=float(distances[idx])
    # Recover a closest conductor pixel to annotate the true shortest segment.
    ly,lx=np.where(line>0)
    sq=(lx-x0).astype(np.float64)**2+(ly-y0).astype(np.float64)**2
    j=int(np.argmin(sq)); x1,y1=int(lx[j]),int(ly[j]); d=float(np.sqrt(sq[j]))
    # Pixel thresholds are illustrative at a maximum image dimension of 960 px.
    # Never label this "Safe" or imply actual utility clearance.
    if d<=12: proximity='Close in image'
    elif d<=40: proximity='Moderate in image'
    else: proximity='Separated in image'
    if frame is not None:
        cv2.line(frame,(x0,y0),(x1,y1),(255,70,70),2)
        cv2.circle(frame,(x0,y0),5,(255,255,255),-1)
        cv2.circle(frame,(x1,y1),5,(255,70,70),-1)
    return {'pixel_gap':round(d,2),'screening_proximity':proximity,
            'distance_method':'canopy-boundary-to-conductor-mask-euclidean',
            'measurement_points':{'canopy':[x0,y0],'conductor':[x1,y1]},
            'pixel_thresholds_demo':{'close_lte':12,'moderate_lte':40},
            'physical_clearance_ft':None,'physical_severity':'Not determined',
            'calibration_status':'2D image only; depth and perspective not established'}

def point_to_infinite_line(x,y,A,B,C):
    denom=float(np.hypot(A,B))
    if denom==0:raise ValueError('Invalid line')
    return abs(A*x+B*y+C)/denom
