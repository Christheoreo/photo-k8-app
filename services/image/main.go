package main

import (
	"bytes"
	"context"
	"image"
	"image/jpeg"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"net"

	pb "github.com/christheoreo/photo-k8-app/image/proto"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedImageServiceServer
}

func toGreyscale(img image.Image) image.Image {
	bounds := img.Bounds()
	grey := image.NewGray(bounds)
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			grey.Set(x, y, img.At(x, y))
		}
	}
	return grey
}

func (s *server) ProcessImage(ctx context.Context, req *pb.ProcessImageRequest) (*pb.ProcessImageResponse, error) {
	img, _, err := image.Decode(bytes.NewReader(req.ImageData))
	if err != nil {
		return &pb.ProcessImageResponse{Success: false, Error: err.Error()}, nil
	}

	var processed image.Image
	switch req.Operation {
	case "greyscale":
		processed = toGreyscale(img)
	default:
		processed = img
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, processed, nil); err != nil {
		return &pb.ProcessImageResponse{Success: false, Error: err.Error()}, nil
	}

	return &pb.ProcessImageResponse{
		ImageData: buf.Bytes(),
		Success:   true,
	}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterImageServiceServer(s, &server{})

	log.Printf("Image service listening on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
